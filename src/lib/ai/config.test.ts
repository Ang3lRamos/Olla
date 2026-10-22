import { describe, expect, it } from "vitest";
import { readAiConfig } from "./config";

describe("readAiConfig", () => {
  it("lee la configuración con valores por defecto y sin barra final", () => {
    expect(readAiConfig({ AI_BASE_URL: "http://localhost:20128/v1/", AI_MODEL: "gpt-libre" })).toEqual({
      baseUrl: "http://localhost:20128/v1",
      apiKey: "",
      models: ["gpt-libre"],
      timeoutMs: 30000,
      maxRetries: 2,
      reasoningEffort: null,
      maxTokens: null,
    });
  });

  it("acepta varios modelos separados por coma, en orden de preferencia", () => {
    const config = readAiConfig({ AI_BASE_URL: "x", AI_MODEL: " grande , mediano,, pequeño " });
    expect(config?.models).toEqual(["grande", "mediano", "pequeño"]);
    expect(readAiConfig({ AI_BASE_URL: "x", AI_MODEL: " , " })).toBeNull();
  });

  it("sin URL o sin modelo no hay IA configurada", () => {
    expect(readAiConfig({})).toBeNull();
    expect(readAiConfig({ AI_BASE_URL: "http://localhost:20128/v1" })).toBeNull();
  });

  it("el modo simulado no necesita modelo", () => {
    expect(readAiConfig({ AI_BASE_URL: "mock" })?.baseUrl).toBe("mock");
  });

  it("ignora límites absurdos", () => {
    expect(readAiConfig({ AI_BASE_URL: "x", AI_MODEL: "m", AI_MAX_RETRIES: "50" })).toBeNull();
  });
});
