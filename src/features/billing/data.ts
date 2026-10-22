import "server-only";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
