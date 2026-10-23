"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/features/household/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteAccountResult = { ok: false; error: string };

/**
 * Borra la cuenta y, si nadie más vive en el hogar, el hogar con todos sus datos. Los pagos se
 * conservan sin vínculo al hogar, porque la ley contable obliga a guardarlos.
 */
export async function deleteMyAccount(confirmEmail: string): Promise<DeleteAccountResult> {
  const user = await requireUser();
  if (confirmEmail.trim().toLowerCase() !== user.email?.toLowerCase()) {
    return { ok: false, error: "Escribe tu correo tal como aparece arriba para confirmar." };
  }
  const admin = createSupabaseAdminClient();
  const { error } = admin ? await admin.auth.admin.deleteUser(user.id) : { error: true };
  if (error) return { ok: false, error: "No pudimos borrar tu cuenta. Vuelve a intentarlo." };

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/ingresar?aviso=cuenta-borrada");
}
