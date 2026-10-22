"use server";

import { revalidatePath } from "next/cache";
import { requireHousehold, type Household } from "@/features/household/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assignMealSchema,
  slotKeySchema,
  weekPeopleSchema,
  type AssignMealInput,
  type SlotKey,
} from "./schemas";

export type WeekActionResult = { ok: true } | { ok: false; error: string };

const SAVE_ERROR = "No pudimos guardar el cambio en la semana. Revisa tu conexión y vuelve a intentarlo.";
const INVALID = "Ese cambio no es válido para esta semana.";
const UNIQUE_VIOLATION = "23505";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function findWeekPlanId(supabase: Supabase, weekStart: string) {
  const { data } = await supabase.from("week_plans").select("id").eq("week_start", weekStart).maybeSingle();
  return data?.id ?? null;
}

/** La semana se crea la primera vez que se guarda algo en ella, con las personas del hogar. */
async function ensureWeekPlan(supabase: Supabase, household: Household, weekStart: string) {
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

export async function assignMeal(input: AssignMealInput): Promise<WeekActionResult> {
  const household = await requireHousehold();
  const parsed = assignMealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };

  const supabase = await createSupabaseServerClient();
  const weekPlanId = await ensureWeekPlan(supabase, household, parsed.data.weekStart);
  if (!weekPlanId) return { ok: false, error: SAVE_ERROR };

  const { error } = await supabase.from("meal_slots").upsert(
    {
      week_plan_id: weekPlanId,
      day: parsed.data.day,
      meal: parsed.data.meal,
      recipe_id: parsed.data.recipeId,
      people_override: parsed.data.peopleOverride,
    },
    { onConflict: "week_plan_id,day,meal" },
  );
  if (error) return { ok: false, error: SAVE_ERROR };

  revalidatePath("/semana");
  return { ok: true };
}

export async function clearMeal(input: SlotKey): Promise<WeekActionResult> {
  await requireHousehold();
  const parsed = slotKeySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };

  const supabase = await createSupabaseServerClient();
  const weekPlanId = await findWeekPlanId(supabase, parsed.data.weekStart);
  if (!weekPlanId) return { ok: true };

  const { error } = await supabase
    .from("meal_slots")
    .delete()
    .eq("week_plan_id", weekPlanId)
    .eq("day", parsed.data.day)
    .eq("meal", parsed.data.meal);
  if (error) return { ok: false, error: SAVE_ERROR };

  revalidatePath("/semana");
  return { ok: true };
}

export async function setWeekPeople(input: { weekStart: string; people: number }): Promise<WeekActionResult> {
  const household = await requireHousehold();
  const parsed = weekPeopleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("week_plans")
    .upsert(
      { household_id: household.id, week_start: parsed.data.weekStart, people: parsed.data.people },
      { onConflict: "household_id,week_start" },
    );
  if (error) return { ok: false, error: SAVE_ERROR };

  revalidatePath("/semana");
  return { ok: true };
}
