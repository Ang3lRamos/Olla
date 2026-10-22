import type { z } from "zod";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * - not_configured: faltan las variables AI_* en el entorno.
 * - timeout: el proveedor no respondió a tiempo, ni siquiera tras reintentar.
 * - unavailable: error de red o del proveedor (5xx, rechazos).
 * - rate_limited: el proveedor no tiene cupo ahora (429); vuelve a haberlo en un rato.
 * - invalid_response: respondió, pero no con el JSON que pedimos.
 */
export type AiErrorKind = "not_configured" | "timeout" | "unavailable" | "rate_limited" | "invalid_response";

export interface AiError {
  kind: AiErrorKind;
  /** Detalle técnico para los logs; no se muestra tal cual al usuario. */
  detail: string;
}

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: AiError };

export interface JsonRequest<T> {
  schema: z.ZodType<T>;
  messages: ChatMessage[];
  temperature?: number;
}

/** Lo único que el resto de la app sabe de la IA: pedir JSON validado contra un esquema. */
export interface AiClient {
  completeJson<T>(request: JsonRequest<T>): Promise<AiResult<T>>;
}
