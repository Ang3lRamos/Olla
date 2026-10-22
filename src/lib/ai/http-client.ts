import { z } from "zod";
import type { AiConfig } from "./config";
import { extractJson } from "./json";
import type { AiClient, AiError, AiResult, ChatMessage, JsonRequest } from "./types";

interface HttpClientDeps {
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const BASE_BACKOFF_MS = 500;
const MAX_ERROR_DETAIL = 300;

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
});

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const fail = (kind: AiError["kind"], detail: string): { ok: false; error: AiError } => ({
  ok: false,
  error: { kind, detail: detail.slice(0, MAX_ERROR_DETAIL) },
});

type Attempt<T> =
  | AiResult<T>
  | {
      ok: false;
      error: AiError;
      retry: "backoff" | "without-response-format" | "with-correction";
      reply?: string;
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
    messages: ChatMessage[],
    useResponseFormat: boolean,
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
          model: config.model,
          messages,
          temperature: request.temperature ?? 0.4,
          ...(useResponseFormat && { response_format: { type: "json_object" } }),
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
      if (response.status === 400 && useResponseFormat && /response_format/i.test(body)) {
        return { ...fail("unavailable", body), retry: "without-response-format" };
      }
      const retriable = response.status === 429 || response.status >= 500;
      const error = fail("unavailable", `HTTP ${response.status}: ${body}`);
      return retriable ? { ...error, retry: "backoff" } : error;
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

  return {
    async completeJson<T>(request: JsonRequest<T>): Promise<AiResult<T>> {
      let messages = request.messages;
      let useResponseFormat = true;
      let lastError: AiError = { kind: "unavailable", detail: "Sin intentos" };

      for (let tries = 0; tries <= config.maxRetries; tries++) {
        const result = await attempt(request, messages, useResponseFormat);
        if (result.ok) return result;
        lastError = result.error;
        if (!("retry" in result) || tries === config.maxRetries) break;

        if (result.retry === "without-response-format") {
          useResponseFormat = false;
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
        } else {
          await sleep(BASE_BACKOFF_MS * 2 ** tries);
        }
      }
      return { ok: false, error: lastError };
    },
  };
}
