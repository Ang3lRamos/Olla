import { z } from "zod";

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  /** En orden de preferencia: si uno se queda sin cupo o falla, se usa el siguiente. */
  models: string[];
  timeoutMs: number;
  maxRetries: number;
  /** "low" hace que los modelos que razonan (p. ej. gpt-oss) respondan más rápido y gasten menos. */
  reasoningEffort: "low" | "medium" | "high" | null;
  /** Tope de la respuesta; algunos proveedores rechazan sin él si su cupo por minuto es bajo. */
  maxTokens: number | null;
}

/** Valor especial de AI_BASE_URL para usar el asistente simulado (desarrollo y demos). */
export const SIMULATED_AI_BASE_URL = "mock";

const configSchema = z.object({
  AI_BASE_URL: z.string().trim().min(1),
  AI_API_KEY: z.string().trim().default(""),
  AI_MODEL: z.string().trim().default(""),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300_000).default(30_000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  AI_REASONING_EFFORT: z.enum(["low", "medium", "high"]).optional(),
  AI_MAX_TOKENS: z.coerce.number().int().min(100).max(32_000).optional(),
});

/**
 * Lee la configuración de la IA del entorno. Devuelve null si falta lo mínimo, para que la
 * app muestre "no configurado" en lugar de fallar.
 */
export function readAiConfig(env: Record<string, string | undefined> = process.env): AiConfig | null {
  const parsed = configSchema.safeParse({
    AI_BASE_URL: env.AI_BASE_URL || undefined,
    AI_API_KEY: env.AI_API_KEY || undefined,
    AI_MODEL: env.AI_MODEL || undefined,
    AI_TIMEOUT_MS: env.AI_TIMEOUT_MS || undefined,
    AI_MAX_RETRIES: env.AI_MAX_RETRIES || undefined,
    AI_REASONING_EFFORT: env.AI_REASONING_EFFORT || undefined,
    AI_MAX_TOKENS: env.AI_MAX_TOKENS || undefined,
  });
  if (!parsed.success) return null;

  const {
    AI_BASE_URL,
    AI_API_KEY,
    AI_MODEL,
    AI_TIMEOUT_MS,
    AI_MAX_RETRIES,
    AI_REASONING_EFFORT,
    AI_MAX_TOKENS,
  } = parsed.data;
  const models = AI_MODEL.split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  if (AI_BASE_URL !== SIMULATED_AI_BASE_URL && models.length === 0) return null;
  return {
    baseUrl: AI_BASE_URL.replace(/\/+$/, ""),
    apiKey: AI_API_KEY,
    models,
    timeoutMs: AI_TIMEOUT_MS,
    maxRetries: AI_MAX_RETRIES,
    reasoningEffort: AI_REASONING_EFFORT ?? null,
    maxTokens: AI_MAX_TOKENS ?? null,
  };
}
