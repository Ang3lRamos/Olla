import { z } from "zod";

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  /** En orden de preferencia: si uno se queda sin cupo o falla, se usa el siguiente. */
  models: string[];
  timeoutMs: number;
  maxRetries: number;
}

/** Valor especial de AI_BASE_URL para usar el asistente simulado (desarrollo y demos). */
export const SIMULATED_AI_BASE_URL = "mock";

const configSchema = z.object({
  AI_BASE_URL: z.string().trim().min(1),
  AI_API_KEY: z.string().trim().default(""),
  AI_MODEL: z.string().trim().default(""),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300_000).default(30_000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
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
  });
  if (!parsed.success) return null;

  const { AI_BASE_URL, AI_API_KEY, AI_MODEL, AI_TIMEOUT_MS, AI_MAX_RETRIES } = parsed.data;
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
  };
}
