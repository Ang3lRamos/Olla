import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PLANS } from "@/features/entitlements/quota";
import type { Entitlement } from "./plan-notice";
import { PERIODS, type PlanPrice } from "./plans";

const priceRowSchema = z
  .object({
    plan: z.enum(["basic", "pro"]),
    period: z.enum(PERIODS),
    amount_in_cents: z.number(),
    days: z.number(),
    ai_daily_limit: z.number(),
  })
  .transform((row): PlanPrice => ({
    plan: row.plan,
    period: row.period,
    amountCop: row.amount_in_cents / 100,
    days: row.days,
    aiDailyLimit: row.ai_daily_limit,
  }));

/** Precios vigentes: viven en la base, que es la que fija el monto de cada pago. */
export async function listPlanPrices(): Promise<PlanPrice[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("plan_prices")
    .select("plan, period, amount_in_cents, days, ai_daily_limit")
    .order("amount_in_cents");
  if (error) throw new Error(`No se pudieron leer los precios de los planes: ${error.message}`);
  return z.array(priceRowSchema).parse(data);
}

/**
 * Los mismos precios para la página de inicio, que se ve sin sesión: los lee el servidor y
 * quedan en caché unas horas. Sin la llave del servidor (desarrollo local) no hay precios.
 */
export async function listPublicPlanPrices(): Promise<PlanPrice[]> {
  "use cache";
  cacheLife("hours");
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("plan_prices")
    .select("plan, period, amount_in_cents, days, ai_daily_limit")
    .order("amount_in_cents");
  if (error) throw new Error(`No se pudieron leer los precios de los planes: ${error.message}`);
  return z.array(priceRowSchema).parse(data);
}

/**
 * El plan tal como está guardado, aunque ya haya vencido (para avisar que venció). La prueba
 * se reconoce porque el hogar la usó y no tiene ningún pago aplicado.
 */
export async function getEntitlement(householdId: string): Promise<Entitlement | null> {
  const supabase = await createSupabaseServerClient();
  const [entitlement, payments] = await Promise.all([
    supabase
      .from("household_entitlements")
      .select("plan, expires_at, trial_used")
      .eq("household_id", householdId)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("reference", { count: "exact", head: true })
      .eq("household_id", householdId)
      .not("applied_at", "is", null),
  ]);
  const row = entitlement.data;
  if (!row) return null;
  return {
    plan: z.enum(PLANS).catch("free").parse(row.plan),
    expiresAt: row.expires_at,
    isTrial: row.trial_used && (payments.count ?? 0) === 0,
  };
}

export interface LastPayment {
  reference: string;
  amountCop: number;
  paidAt: string;
  refundRequested: boolean;
}

/** El último pago aprobado y aplicado del hogar que no se haya devuelto; sirve para el retracto. */
export async function getLastPayment(householdId: string): Promise<LastPayment | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("reference, amount_in_cents, applied_at, refund_requested_at")
    .eq("household_id", householdId)
    .eq("status", "APPROVED")
    .not("applied_at", "is", null)
    .is("refunded_at", null)
    .order("applied_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el último pago: ${error.message}`);
  if (!data?.applied_at) return null;
  return {
    reference: data.reference,
    amountCop: data.amount_in_cents / 100,
    paidAt: data.applied_at,
    refundRequested: data.refund_requested_at !== null,
  };
}
