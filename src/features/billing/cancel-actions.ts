"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireHousehold, requireUser } from "@/features/household/data";
import { sendEmail } from "@/lib/email/send";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getEntitlement, getLastPayment } from "./data";
import { refundNoticeEmail } from "./refund-notice";
import { refundWindow } from "./refund-window";

export type BillingResult = { ok: true } | { ok: false; error: string };

const RETRY = "Vuelve a intentarlo en un momento.";

/** El plan y los pagos solo los escribe el servidor; la membresía ya la verificó requireHousehold. */
function serverClient() {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Falta SUPABASE_SECRET_KEY para cambiar planes.");
  return admin;
}

/**
 * Termina el plan hoy, sin reembolso, y el hogar vuelve a Gratis. Los planes no se cobran
 * solos, así que no hay una renovación que cancelar.
 */
export async function cancelPlan(): Promise<BillingResult> {
  const household = await requireHousehold();
  const entitlement = await getEntitlement(household.id);
  if (!entitlement || entitlement.plan === "free") {
    return { ok: false, error: "Tu hogar ya está en el plan Gratis." };
  }

  const { error } = await serverClient()
    .from("household_entitlements")
    .update({ plan: "free", ai_daily_limit: 0, expires_at: null, updated_at: new Date().toISOString() })
    .eq("household_id", household.id);
  if (error) return { ok: false, error: `No pudimos cancelar el plan. ${RETRY}` };
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Deja la solicitud de reembolso para que soporte la revise con la persona. El plan sigue
 * activo hasta que soporte la apruebe y devuelva el dinero en Wompi.
 */
export async function requestRefund(): Promise<BillingResult> {
  const [user, household] = await Promise.all([requireUser(), requireHousehold()]);
  const payment = await getLastPayment(household.id);
  if (!payment) return { ok: false, error: "No encontramos un pago para reembolsar." };
  if (payment.refundRequested) return { ok: true };
  const retract = refundWindow(payment.paidAt, new Date());
  if (!retract.open) {
    return { ok: false, error: "El plazo de 5 días hábiles para pedir el reembolso ya pasó." };
  }

  const { error } = await serverClient()
    .from("payments")
    .update({ refund_requested_at: new Date().toISOString() })
    .eq("reference", payment.reference)
    .eq("household_id", household.id);
  if (error) return { ok: false, error: `No pudimos registrar la solicitud. ${RETRY}` };

  // La solicitud ya quedó en el panel; el correo es el aviso para no dejarla esperando.
  const supportEmail = process.env.LEGAL_CONTACT_EMAIL;
  if (supportEmail) {
    const origin = (await headers()).get("origin") ?? "";
    await sendEmail(
      refundNoticeEmail({
        supportEmail,
        customerEmail: user.email ?? "(sin correo)",
        amountCop: payment.amountCop,
        reference: payment.reference,
        deadline: retract.deadline,
        adminUrl: `${origin}/admin`,
      }),
    );
  }
  revalidatePath("/planes");
  return { ok: true };
}
