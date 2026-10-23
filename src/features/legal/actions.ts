"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/household/data";
import { createSupabaseAuthClient } from "@/lib/supabase/server";
import { LEGAL_VERSION } from "./owner";

/** Deja constancia de que la persona aceptó la versión vigente (prueba de la autorización). */
export async function acceptLegalUpdate(): Promise<{ ok: boolean }> {
  await requireUser();
  const supabase = await createSupabaseAuthClient();
  const { error } = await supabase.auth.updateUser({
    data: { legal_version: LEGAL_VERSION, legal_accepted_at: new Date().toISOString() },
  });
  if (error) return { ok: false };
  // El aviso se decide con el JWT: se renueva para que traiga la versión recién aceptada.
  await supabase.auth.refreshSession();
  revalidatePath("/", "layout");
  return { ok: true };
}
