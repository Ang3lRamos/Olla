import "server-only";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FREE_QUOTA, type AiQuota } from "./quota";

export type { AiQuota } from "./quota";

const quotaRowSchema = z
  .object({ plan: z.enum(["free", "pro"]), daily_limit: z.number().nullable(), used: z.number() })
  .transform((row): AiQuota => ({ plan: row.plan, dailyLimit: row.daily_limit, used: row.used }));

export async function getAiQuota(householdId: string): Promise<AiQuota> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_ai_quota", { target_household_id: householdId });
  if (error) throw new Error(`No se pudo leer el plan: ${error.message}`);
  const [row] = data ?? [];
  return row ? quotaRowSchema.parse(row) : FREE_QUOTA;
}

/** Descuenta una consulta en la base (atómico); el cliente no puede saltarse el tope. */
export async function consumeAiRequest(householdId: string): Promise<{ allowed: boolean; quota: AiQuota }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("consume_ai_request", { target_household_id: householdId });
  if (error) throw new Error(`No se pudo validar el cupo: ${error.message}`);
  const row = z.object({ allowed: z.boolean() }).and(quotaRowSchema).parse(data?.[0]);
  return { allowed: row.allowed, quota: { plan: row.plan, dailyLimit: row.dailyLimit, used: row.used } };
}

export async function refundAiRequest(householdId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("refund_ai_request", { target_household_id: householdId });
}
