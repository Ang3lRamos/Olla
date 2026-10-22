import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { AiConfig } from "./config";
import { createHttpAiClient } from "./http-client";

const config: AiConfig = {
  baseUrl: "http://localhost:20128/v1",
  apiKey: "clave",
  models: ["modelo-gratis"],
  timeoutMs: 1000,
  maxRetries: 2,
};
const schema = z.object({ recipeId: z.string() });
const request = { schema, messages: [{ role: "user" as const, content: "Propón algo" }] };

const completion = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
const status = (code: number, body = "error") => new Response(body, { status: code });

function setup(...responses: Array<Response | Error>) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  for (const response of responses) {
    if (response instanceof Error) fetch.mockRejectedValueOnce(response);
    else fetch.mockResolvedValueOnce(response);
  }
  const sleep = vi.fn(async () => undefined);
  const client = createHttpAiClient(config, { fetch, sleep });
  const body = (call: number) => JSON.parse(String(fetch.mock.calls[call]![1]!.body));
  return { client, fetch, sleep, body };
}

describe("createHttpAiClient", () => {
  it("envía modelo, clave y pide JSON; devuelve los datos validados", async () => {
    const { client, fetch, body } = setup(completion('{"recipeId": "abc"}'));
    expect(await client.completeJson(request)).toEqual({ ok: true, data: { recipeId: "abc" } });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("http://localhost:20128/v1/chat/completions");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer clave");
    expect(body(0)).toMatchObject({ model: "modelo-gratis", response_format: { type: "json_object" } });
  });

  it("acepta el JSON envuelto en texto o bloques de código", async () => {
    const { client } = setup(completion('Aquí va:\n```json\n{"recipeId": "abc"}\n```'));
    expect(await client.completeJson(request)).toMatchObject({ ok: true });
  });

  it("reintenta con espera creciente si el proveedor falla y luego responde", async () => {
    const { client, sleep } = setup(status(503), status(429), completion('{"recipeId": "abc"}'));
    expect(await client.completeJson(request)).toMatchObject({ ok: true });
    expect(sleep.mock.calls).toEqual([[500], [1000]]);
  });

  it("sin cupo espera lo que pide Retry-After si es poco", async () => {
    const limited = new Response("rate limit", { status: 429, headers: { "retry-after": "7" } });
    const { client, sleep } = setup(limited, completion('{"recipeId": "abc"}'));
    expect(await client.completeJson(request)).toMatchObject({ ok: true });
    expect(sleep.mock.calls).toEqual([[7000]]);
  });

  it("sin cupo por mucho rato no insiste y lo informa", async () => {
    const limited = new Response("rate limit", { status: 429, headers: { "retry-after": "45" } });
    const { client, fetch } = setup(limited, completion('{"recipeId": "abc"}'));
    expect(await client.completeJson(request)).toMatchObject({ ok: false, error: { kind: "rate_limited" } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  describe("con modelos de respaldo", () => {
    const withFallback = { ...config, models: ["grande", "mediano"] };
    function setupFallback(...responses: Response[]) {
      const fetch = vi.fn<typeof globalThis.fetch>();
      for (const response of responses) fetch.mockResolvedValueOnce(response);
      const sleep = vi.fn(async () => undefined);
      const client = createHttpAiClient(withFallback, { fetch, sleep });
      const modelOf = (call: number) => JSON.parse(String(fetch.mock.calls[call]![1]!.body)).model;
      return { client, fetch, sleep, modelOf };
    }

    it("sin cupo pasa al siguiente modelo sin esperar", async () => {
      const limited = new Response("rate limit", { status: 429, headers: { "retry-after": "7" } });
      const { client, sleep, modelOf } = setupFallback(limited, completion('{"recipeId": "abc"}'));
      expect(await client.completeJson(request)).toMatchObject({ ok: true });
      expect([modelOf(0), modelOf(1)]).toEqual(["grande", "mediano"]);
      expect(sleep).not.toHaveBeenCalled();
    });

    it("si el modelo no corrige el formato, prueba con el siguiente", async () => {
      const { client, modelOf } = setupFallback(
        completion("no sé"),
        completion("tampoco"),
        completion("nada"),
        completion('{"recipeId": "abc"}'),
      );
      expect(await client.completeJson(request)).toMatchObject({ ok: true });
      expect(modelOf(3)).toBe("mediano");
    });

    it("con la clave rechazada no prueba otros modelos", async () => {
      const { client, fetch } = setupFallback(status(401), completion('{"recipeId": "abc"}'));
      expect(await client.completeJson(request)).toMatchObject({ ok: false, error: { kind: "unavailable" } });
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("si todos fallan informa el error del último", async () => {
      const { client } = setupFallback(
        status(503),
        new Response("rate limit", { status: 429 }),
        status(429),
        status(429),
      );
      expect(await client.completeJson(request)).toMatchObject({
        ok: false,
        error: { kind: "rate_limited" },
      });
    });
  });

  it("se rinde tras el límite de reintentos", async () => {
    const { client, fetch } = setup(status(500), status(502), status(503), completion("{}"));
    expect(await client.completeJson(request)).toMatchObject({ ok: false, error: { kind: "unavailable" } });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("informa timeout cuando el proveedor no responde a tiempo", async () => {
    const timeout = new DOMException("The operation timed out.", "TimeoutError");
    const { client } = setup(timeout, timeout, timeout);
    expect(await client.completeJson(request)).toMatchObject({ ok: false, error: { kind: "timeout" } });
  });

  it("no reintenta errores de configuración (p. ej. 401)", async () => {
    const { client, fetch } = setup(status(401, "clave inválida"));
    expect(await client.completeJson(request)).toMatchObject({ ok: false, error: { kind: "unavailable" } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("si la respuesta no es JSON válido, vuelve a pedirla explicando el error", async () => {
    const { client, body } = setup(completion("Te recomiendo el sudado."), completion('{"recipeId": "abc"}'));
    expect(await client.completeJson(request)).toMatchObject({ ok: true });
    const retry = body(1).messages;
    expect(retry.at(-2)).toEqual({ role: "assistant", content: "Te recomiendo el sudado." });
    expect(retry.at(-1).content).toMatch(/no cumple el formato/);
  });

  it("valida contra el esquema y reporta respuesta inválida si nunca lo cumple", async () => {
    const wrong = completion('{"receta": 1}');
    const { client } = setup(wrong, completion('{"receta": 2}'), completion('{"receta": 3}'));
    expect(await client.completeJson(request)).toMatchObject({
      ok: false,
      error: { kind: "invalid_response" },
    });
  });

  it("repite sin response_format si el proveedor no lo soporta", async () => {
    const { client, body } = setup(
      status(400, "response_format is not supported"),
      completion('{"recipeId": "abc"}'),
    );
    expect(await client.completeJson(request)).toMatchObject({ ok: true });
    expect(body(1).response_format).toBeUndefined();
  });

  it("trata un error de red como no disponible", async () => {
    const { client } = setup(
      new TypeError("fetch failed"),
      new TypeError("fetch failed"),
      new TypeError("fetch failed"),
    );
    expect(await client.completeJson(request)).toMatchObject({ ok: false, error: { kind: "unavailable" } });
  });
});
