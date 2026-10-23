import "server-only";
import { createSupabaseAdminClient } from "./supabase/admin";

export interface RateLimit {
  max: number;
  windowSeconds: number;
}

/** Acciones con sesión: muy por encima del uso normal, solo frena scripts y abusos. */
export const ACTIONS_PER_USER: RateLimit = { max: 60, windowSeconds: 60 };
/** Ingresar, registrarse, recuperar la contraseña y reenviar correos, por IP. */
export const AUTH_ATTEMPTS_PER_IP: RateLimit = { max: 10, windowSeconds: 600 };

export const RATE_LIMITED_MESSAGE =
  "Demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.";

/**
 * Cuenta un intento en `bucket` y dice si todavía está dentro del límite. Si la base no
 * responde, deja pasar: es mejor no frenar a nadie que dejar la app inutilizable.
 */
export async function withinRateLimit(bucket: string, limit: RateLimit): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return true;
  const { data, error } = await admin.rpc("hit_rate_limit", {
    target_bucket: bucket,
    max_hits: limit.max,
    window_seconds: limit.windowSeconds,
  });
  if (error) {
    console.error("[rate-limit]", bucket, error.message);
    return true;
  }
  return data;
}
