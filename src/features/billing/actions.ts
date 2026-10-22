"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { getCurrentUser, requireHousehold } from "@/features/household/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildCheckoutUrl } from "@/lib/wompi/checkout";
import { readWompiConfig } from "@/lib/wompi/config";
import { PERIODS } from "./plans";

const RESULT_PATH = "/planes/resultado";

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

const checkoutSchema = z.object({ plan: z.enum(["basic", "pro"]), period: z.enum(PERIODS) });

/**
 * Crea el pago pendiente (el monto lo pone la base) y devuelve el enlace al checkout de Wompi,
 * donde la persona paga con tarjeta, PSE, Nequi o Bancolombia.
 */
export async function startCheckout(input: z.input<typeof checkoutSchema>): Promise<CheckoutResult> {
  const household = await requireHousehold();
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ese plan no existe." };
  const config = readWompiConfig();
  if (!config) return { ok: false, error: "Los pagos no están disponibles en este momento." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_payment", {
    target_household_id: household.id,
    target_plan: parsed.data.plan,
    target_period: parsed.data.period,
  });
  const payment = data?.[0];
  if (error || !payment) return { ok: false, error: "No pudimos preparar el pago. Vuelve a intentarlo." };

  const origin = (await headers()).get("origin") ?? "";
  const user = await getCurrentUser();
  return {
    ok: true,
    url: buildCheckoutUrl(config, {
      reference: payment.reference,
      amountInCents: Number(payment.amount_in_cents),
      redirectUrl: `${origin}${RESULT_PATH}`,
      email: user?.email ?? undefined,
    }),
  };
}

export type TrialResult = { ok: true } | { ok: false; error: string };

/** Siete días de Pro sin pedir tarjeta; la base se asegura de que sea una sola vez por hogar. */
export async function startTrial(): Promise<TrialResult> {
  const household = await requireHousehold();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("start_trial", { target_household_id: household.id });
  if (error) return { ok: false, error: "No pudimos activar la prueba. Vuelve a intentarlo." };
  if (!data) return { ok: false, error: "Tu hogar ya usó la prueba gratis." };
  revalidatePath("/", "layout");
  return { ok: true };
}
