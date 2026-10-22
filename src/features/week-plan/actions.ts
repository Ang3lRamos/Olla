"use server";

import { revalidatePath } from "next/cache";
import { requireHousehold } from "@/features/household/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureWeekPlan, findWeekPlanId } from "./week-plan-id";
import {
  assignMealSchema,
  mealChangesSchema,
  slotKeySchema,
  weekPeopleSchema,
  type AssignMealInput,
  type MealChangesInput,
  type SlotKey,
} from "./schemas";

export type WeekActionResult = { ok: true } | { ok: false; error: string };

const SAVE_ERROR = "No pudimos guardar el cambio en la semana. Revisa tu conexión y vuelve a intentarlo.";
const INVALID = "Ese cambio no es válido para esta semana.";

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

/** Aplica varios cambios a la vez (p. ej. la propuesta del asistente) conservando las personas de cada comida. */
export async function applyMealChanges(input: MealChangesInput): Promise<WeekActionResult> {
  const household = await requireHousehold();
  const parsed = mealChangesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };

  const supabase = await createSupabaseServerClient();
  const weekPlanId = await ensureWeekPlan(supabase, household, parsed.data.weekStart);
  if (!weekPlanId) return { ok: false, error: SAVE_ERROR };

  const { data: current, error: readError } = await supabase
    .from("meal_slots")
    .select("day, meal, people_override")
    .eq("week_plan_id", weekPlanId);
  if (readError) return { ok: false, error: SAVE_ERROR };
  const overrideOf = (day: number, meal: string) =>
    current.find((slot) => slot.day === day && slot.meal === meal)?.people_override ?? null;

  const assignments = parsed.data.changes.flatMap(({ day, meal, recipeId }) =>
    recipeId
      ? [{ week_plan_id: weekPlanId, day, meal, recipe_id: recipeId, people_override: overrideOf(day, meal) }]
      : [],
  );
  if (assignments.length) {
    const { error } = await supabase
      .from("meal_slots")
      .upsert(assignments, { onConflict: "week_plan_id,day,meal" });
    if (error) return { ok: false, error: SAVE_ERROR };
  }
  for (const { day, meal } of parsed.data.changes.filter((change) => change.recipeId === null)) {
    const { error } = await supabase
      .from("meal_slots")
      .delete()
      .eq("week_plan_id", weekPlanId)
      .eq("day", day)
      .eq("meal", meal);
    if (error) return { ok: false, error: SAVE_ERROR };
  }

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
