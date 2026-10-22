import { z } from "zod";
import type { AiConfig } from "./config";
import { extractJson } from "./json";
import type { AiClient, AiError, AiResult, ChatMessage, JsonRequest } from "./types";

interface HttpClientDeps {
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const BASE_BACKOFF_MS = 500;
/** Más que esto no se espera un cupo del proveedor: es mejor pedirle a la persona que vuelva en un rato. */
const MAX_RATE_LIMIT_WAIT_MS = 15_000;
const MAX_ERROR_DETAIL = 300;

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
});

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const fail = (kind: AiError["kind"], detail: string): { ok: false; error: AiError } => ({
  ok: false,
  error: { kind, detail: detail.slice(0, MAX_ERROR_DETAIL) },
});

/** Si el proveedor dice cuándo vuelve a haber cupo y es pronto, se espera eso; si no, no se insiste. */
function rateLimited(response: Response, body: string): Attempt<never> {
  const error = fail("rate_limited", `HTTP 429: ${body}`);
  const retryAfterSeconds = Number(response.headers.get("retry-after"));
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) return { ...error, retry: "backoff" };
  const waitMs = retryAfterSeconds * 1000;
  return waitMs > MAX_RATE_LIMIT_WAIT_MS ? error : { ...error, retry: "backoff", waitMs };
}

interface RequestOptions {
  useResponseFormat: boolean;
  /** reasoning_effort y max_tokens, si están configurados. */
  useTuning: boolean;
}

type Attempt<T> =
  | AiResult<T>
  /** La clave o el acceso están mal: con otro modelo del mismo proveedor fallaría igual. */
  | { ok: false; error: AiError; fatal: true }
  | {
      ok: false;
      error: AiError;
      retry: "backoff" | "without-response-format" | "without-tuning" | "with-correction";
      reply?: string;
      /** Espera que pidió el proveedor (Retry-After); reemplaza la espera creciente. */
      waitMs?: number;
    };

/**
 * Cliente para cualquier API compatible con OpenAI (/chat/completions): OmniRoute en local
 * hoy, un proveedor de pago mañana, cambiando solo el .env.
 */
export function createHttpAiClient(config: AiConfig, deps: HttpClientDeps = {}): AiClient {
  const doFetch = deps.fetch ?? fetch;
  const sleep = deps.sleep ?? wait;

  async function attempt<T>(
    request: JsonRequest<T>,
    model: string,
    messages: ChatMessage[],
    { useResponseFormat, useTuning }: RequestOptions,
  ): Promise<Attempt<T>> {
    let response: Response;
    try {
      response = await doFetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: request.temperature ?? 0.4,
          ...(useResponseFormat && { response_format: { type: "json_object" } }),
          ...(useTuning && config.reasoningEffort && { reasoning_effort: config.reasoningEffort }),
          ...(useTuning && config.maxTokens && { max_tokens: config.maxTokens }),
        }),
        signal: AbortSignal.timeout(config.timeoutMs),
      });
    } catch (error) {
      const timedOut =
        error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
      return { ...fail(timedOut ? "timeout" : "unavailable", String(error)), retry: "backoff" };
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      // Un modelo que no acepta los ajustes opcionales se intenta sin ellos.
      if (response.status === 400 && useTuning && /reasoning_effort|max_tokens/i.test(body)) {
        return { ...fail("unavailable", body), retry: "without-tuning" };
      }
      if (response.status === 400 && useResponseFormat && /response_format/i.test(body)) {
        return { ...fail("unavailable", body), retry: "without-response-format" };
      }
      // Groq rechaza con 400 cuando el modelo genera JSON que su modo estricto no valida; pasa al
      // azar. Sin ese modo, el JSON se extrae y valida aquí, con corrección si hace falta.
      if (response.status === 400 && useResponseFormat && /json_validate_failed/i.test(body)) {
        return { ...fail("invalid_response", body), retry: "without-response-format" };
      }
      if (response.status === 429) return rateLimited(response, body);
      const error = fail("unavailable", `HTTP ${response.status}: ${body}`);
      if (response.status === 401 || response.status === 403) return { ...error, fatal: true };
      return response.status >= 500 ? { ...error, retry: "backoff" } : error;
    }

    const completion = completionSchema.safeParse(await response.json().catch(() => null));
    const content = completion.success ? completion.data.choices[0]!.message.content : null;
    if (!content) return { ...fail("invalid_response", "Respuesta sin contenido"), retry: "backoff" };

    let parsed: unknown;
    try {
      parsed = extractJson(content);
    } catch (error) {
      return { ...fail("invalid_response", String(error)), retry: "with-correction", reply: content };
    }
    const validated = request.schema.safeParse(parsed);
    if (!validated.success) {
      return {
        ...fail("invalid_response", z.prettifyError(validated.error)),
        retry: "with-correction",
        reply: content,
      };
    }
    return { ok: true, data: validated.data };
  }

  /**
   * Intenta con un modelo. Si hay otro de respaldo, una caída, demora o falta de cupo pasa
   * directo al siguiente en vez de insistir; las correcciones de formato sí se reintentan aquí.
   */
  async function completeWithModel<T>(
    request: JsonRequest<T>,
    model: string,
    hasFallback: boolean,
  ): Promise<AiResult<T> & { fatal?: true }> {
    let messages = request.messages;
    const options: RequestOptions = { useResponseFormat: true, useTuning: true };
    let lastError: AiError = { kind: "unavailable", detail: "Sin intentos" };

    for (let tries = 0; tries <= config.maxRetries; tries++) {
      const result = await attempt(request, model, messages, options);
      if (result.ok || "fatal" in result) return result;
      lastError = result.error;
      if (!("retry" in result) || tries === config.maxRetries) break;

      if (result.retry === "without-response-format") {
        options.useResponseFormat = false;
      } else if (result.retry === "without-tuning") {
        options.useTuning = false;
      } else if (result.retry === "with-correction" && result.reply) {
        // Los modelos gratuitos suelen corregirse si se les dice qué estuvo mal.
        messages = [
          ...request.messages,
          { role: "assistant", content: result.reply },
          {
            role: "user",
            content: `Tu respuesta no cumple el formato pedido (${result.error.detail}). Responde de nuevo solo con el objeto JSON válido, sin texto adicional.`,
          },
        ];
      } else if (hasFallback) {
        break;
      } else {
        await sleep(result.waitMs ?? BASE_BACKOFF_MS * 2 ** tries);
      }
    }
    return { ok: false, error: lastError };
  }

  return {
    async completeJson<T>(request: JsonRequest<T>): Promise<AiResult<T>> {
      let lastError: AiError = { kind: "unavailable", detail: "Sin modelos" };
      for (const [index, model] of config.models.entries()) {
        const next = config.models[index + 1];
        const result = await completeWithModel(request, model, next !== undefined);
        if (result.ok) return result;
        lastError = result.error;
        if (result.fatal || !next) break;
        // Queda en los logs para saber cuánto están cargando los modelos de respaldo.
        console.warn(`[ia] ${model} falló (${result.error.kind}); sigue ${next}`);
      }
      return { ok: false, error: lastError };
    },
  };
}
