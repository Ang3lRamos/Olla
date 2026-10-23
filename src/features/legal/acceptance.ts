import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LEGAL_VERSION } from "./owner";

/**
 * Si la persona aceptó una versión anterior de los términos (o ninguna: cuentas de antes de que
 * existieran). Se lee del JWT; al aceptar se renueva la sesión para que el cambio se vea ya.
 */
export async function needsLegalUpdate(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) return false;
  return data.claims.user_metadata?.legal_version !== LEGAL_VERSION;
}
