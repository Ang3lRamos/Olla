import "server-only";
import type { Household } from "@/features/household/data";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const UNIQUE_VIOLATION = "23505";

export async function findWeekPlanId(supabase: Supabase, weekStart: string) {
  const { data } = await supabase.from("week_plans").select("id").eq("week_start", weekStart).maybeSingle();
  return data?.id ?? null;
}

/** La semana se crea la primera vez que se guarda algo en ella, con las personas del hogar. */
export async function ensureWeekPlan(supabase: Supabase, household: Household, weekStart: string) {
  const existing = await findWeekPlanId(supabase, weekStart);
  if (existing) return existing;
  const { data, error } = await supabase
    .from("week_plans")
    .insert({ household_id: household.id, week_start: weekStart, people: household.defaultPeople })
    .select("id")
    .single();
  // Si otra petición la creó al mismo tiempo, se usa esa.
  if (error?.code === UNIQUE_VIOLATION) return findWeekPlanId(supabase, weekStart);
  return error ? null : data.id;
}
