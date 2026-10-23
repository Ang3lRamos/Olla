import "server-only";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FREE_QUOTA, PLANS, type AiQuota } from "./quota";

export type { AiQuota } from "./quota";

const consumeRowSchema = z
  .object({ allowed: z.boolean(), plan: z.enum(PLANS), daily_limit: z.number().nullable(), used: z.number() })
  .transform((row) => ({
    allowed: row.allowed,
    quota: { plan: row.plan, dailyLimit: row.daily_limit, used: row.used },
  }));

const quotaRowSchema = z
  .object({
    plan: z.enum(PLANS),
    daily_limit: z.number().nullable(),
    used: z.number(),
    expires_at: z.string().nullable(),
    trial_used: z.boolean(),
    free_menu_available: z.boolean(),
  })
  .transform((row): AiQuota => ({
    plan: row.plan,
    dailyLimit: row.daily_limit,
    used: row.used,
    expiresAt: row.expires_at,
    trialUsed: row.trial_used,
    freeMenuAvailable: row.free_menu_available,
  }));

export async function getAiQuota(householdId: string): Promise<AiQuota> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_ai_quota", { target_household_id: householdId });
  if (error) throw new Error(`No se pudo leer el plan: ${error.message}`);
  const [row] = data ?? [];
  return row ? quotaRowSchema.parse(row) : FREE_QUOTA;
}

/**
 * Si el hogar tiene hoy un plan pago (o la prueba). Un plan vencido o cancelado cuenta como
 * Gratis: así cada ventaja se apaga sola, sin tocar los datos que la persona guardó.
 */
export async function hasPaidPlan(householdId: string): Promise<boolean> {
  return (await getAiQuota(householdId)).plan !== "free";
}

/** Lo que cambia al consumir: el vencimiento y la prueba no, así que no vienen. */
export type QuotaUsage = Pick<AiQuota, "plan" | "dailyLimit" | "used"> &
  Partial<Pick<AiQuota, "freeMenuAvailable">>;

/** Descuenta una consulta en la base (atómico); el cliente no puede saltarse el tope. */
export async function consumeAiRequest(
  householdId: string,
): Promise<{ allowed: boolean; quota: QuotaUsage }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("consume_ai_request", { target_household_id: householdId });
  if (error) throw new Error(`No se pudo validar el cupo: ${error.message}`);
  const { allowed, quota } = consumeRowSchema.parse(data?.[0]);
  return { allowed, quota };
}

export async function refundAiRequest(householdId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("refund_ai_request", { target_household_id: householdId });
}

/** Gasta el menú gratis de la semana (plan Gratis); false si ya se usó o el hogar paga. */
export async function consumeFreeWeeklyMenu(householdId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("consume_free_weekly_menu", {
    target_household_id: householdId,
  });
  if (error) throw new Error(`No se pudo validar el menú gratis: ${error.message}`);
  return data;
}

export async function refundFreeWeeklyMenu(householdId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("refund_free_weekly_menu", { target_household_id: householdId });
}
