"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHousehold, requireUser } from "@/features/household/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HOME_PATH } from "@/lib/routes";
import { inviteTokenSchema } from "./invite-link";

export type MembersResult = { ok: true } | { ok: false; error: string };
export type InviteResult = { ok: true; token: string } | { ok: false; error: string };

// Lo que las funciones de la base rechazan a propósito (plan, cupo, vencimiento) llega con este
// código y un mensaje en español para la persona; cualquier otro error se queda en el genérico.
const RAISED_BY_FUNCTION = "P0001";
const reason = (error: { code?: string; message: string }, fallback: string) =>
  error.code === RAISED_BY_FUNCTION ? error.message : fallback;

export async function createInvite(): Promise<InviteResult> {
  const household = await requireHousehold();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_household_invite", {
    target_household_id: household.id,
  });
  if (error)
    return { ok: false, error: reason(error, "No pudimos crear la invitación. Vuelve a intentarlo.") };
  revalidatePath("/ajustes");
  return { ok: true, token: data };
}

export async function revokeInvite(token: string): Promise<MembersResult> {
  await requireHousehold();
  if (!inviteTokenSchema.safeParse(token).success) return { ok: false, error: "Invitación no válida." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("revoke_household_invite", { target_token: token });
  if (error) return { ok: false, error: "No pudimos anular la invitación." };
  revalidatePath("/ajustes");
  return { ok: true };
}

export async function acceptInvite(token: string): Promise<MembersResult> {
  await requireUser();
  if (!inviteTokenSchema.safeParse(token).success) return { ok: false, error: "Ese enlace no es válido." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("accept_household_invite", { target_token: token });
  if (error) return { ok: false, error: reason(error, "No pudimos unirte al hogar. Vuelve a intentarlo.") };
  revalidatePath("/", "layout");
  redirect(HOME_PATH);
}

export async function removeMember(userId: string): Promise<MembersResult> {
  const household = await requireHousehold();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_household_member", {
    target_household_id: household.id,
    target_user_id: userId,
  });
  if (error) return { ok: false, error: reason(error, "No pudimos quitar a esa persona.") };
  revalidatePath("/ajustes");
  return { ok: true };
}

/** Sale del hogar: los datos se quedan con quienes siguen ahí, y la persona arma uno nuevo. */
export async function leaveHousehold(): Promise<MembersResult> {
  await requireHousehold();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("leave_household");
  if (error) return { ok: false, error: "No pudimos sacarte del hogar. Vuelve a intentarlo." };
  revalidatePath("/", "layout");
  redirect("/empezar");
}
