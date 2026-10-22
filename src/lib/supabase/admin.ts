import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "../env";
import type { Database } from "./database.types";

/**
 * Cliente con la llave secreta (service_role): salta la RLS. Solo para lo que no tiene sesión
 * de usuario y debe escribir lo que los usuarios no pueden, como activar un plan pagado.
 * null si la llave no está configurada.
 */
export function createSupabaseAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) return null;
  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
