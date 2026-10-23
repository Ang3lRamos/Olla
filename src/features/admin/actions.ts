"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { alertsEmail, sendEmail } from "@/lib/email/send";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "./access";

export type AdminResult = { ok: true } | { ok: false; error: string };

const uuid = z.uuid();

function serverClient() {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Falta SUPABASE_SECRET_KEY.");
  return admin;
}

const done = (error: { message: string } | null, failure: string): AdminResult => {
  if (error) return { ok: false, error: `${failure}: ${error.message}` };
  revalidatePath("/", "layout");
  return { ok: true };
};

async function setFree(householdId: string) {
  return serverClient()
    .from("household_entitlements")
    .update({ plan: "free", ai_daily_limit: 0, expires_at: null, updated_at: new Date().toISOString() })
    .eq("household_id", householdId);
}

/** Devuelve el hogar al plan Gratis, p. ej. después de un reembolso hecho por fuera. */
export async function adminSetFree(householdId: string): Promise<AdminResult> {
  await requireAdmin();
  if (!uuid.safeParse(householdId).success) return { ok: false, error: "Hogar no válido." };
  const { error } = await setFree(householdId);
  return done(error, "No se pudo cambiar el plan");
}

/** Borra la cuenta y, si queda vacío, el hogar con sus datos; los pagos se conservan. */
export async function adminDeleteUser(userId: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (!uuid.safeParse(userId).success) return { ok: false, error: "Usuario no válido." };
  if (userId === admin.id) return { ok: false, error: "Tu propia cuenta se borra desde Ajustes." };
  const { error } = await serverClient().auth.admin.deleteUser(userId);
  return done(error, "No se pudo borrar la cuenta");
}

/**
 * Soporte ya devolvió el dinero en Wompi: queda marcado como devuelto (deja de contar como
 * ingreso) y el hogar vuelve a Gratis.
 */
export async function adminApproveRefund(reference: string): Promise<AdminResult> {
  await requireAdmin();
  const client = serverClient();
  const { data, error } = await client
    .from("payments")
    .update({ refunded_at: new Date().toISOString() })
    .eq("reference", reference)
    .not("refund_requested_at", "is", null)
    .select("household_id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "No se encontró esa solicitud de reembolso." };
  if (data.household_id) {
    const { error: planError } = await setFree(data.household_id);
    if (planError) return done(planError, "Quedó devuelto, pero no se pudo pasar el hogar a Gratis");
  }
  return done(null, "");
}

/** La solicitud no procede (p. ej. la persona desistió con soporte): se descarta y el plan sigue. */
export async function adminRejectRefund(reference: string): Promise<AdminResult> {
  await requireAdmin();
  const { error } = await serverClient()
    .from("payments")
    .update({ refund_requested_at: null })
    .eq("reference", reference)
    .is("refunded_at", null);
  return done(error, "No se pudo descartar la solicitud");
}

/** Comprueba que los avisos a soporte salen: envía uno de prueba y devuelve lo que dijo Resend. */
export async function adminSendTestEmail(): Promise<AdminResult & { to?: string }> {
  await requireAdmin();
  const to = alertsEmail();
  if (!to) return { ok: false, error: "Falta ALERTS_EMAIL (o LEGAL_CONTACT_EMAIL) en el servidor." };
  const result = await sendEmail({
    to,
    subject: "Prueba de avisos de Olla",
    text: "Si lees esto, los avisos de reembolso te van a llegar a este correo.",
  });
  return result.ok ? { ok: true, to } : { ...result, to };
}
