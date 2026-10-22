import "server-only";
import { z } from "zod";
import { MEALS, type IsoDate } from "@/domain/week";
import type { PlannedSlot } from "@/domain/week-plan";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface WeekPlan {
  /** null mientras la semana no tenga ninguna comida guardada. */
  id: string | null;
  weekStart: IsoDate;
  people: number;
  slots: PlannedSlot[];
}

const weekPlanRowSchema = z.object({
  id: z.string(),
  people: z.number(),
  meal_slots: z.array(
    z.object({
      day: z.number().int().min(0).max(6),
      meal: z.enum(MEALS),
      recipe_id: z.string(),
      people_override: z.number().nullable(),
    }),
  ),
});

export async function getWeekPlan(weekStart: IsoDate, defaultPeople: number): Promise<WeekPlan> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("week_plans")
    .select("id, people, meal_slots(day, meal, recipe_id, people_override)")
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer la semana: ${error.message}`);
  if (!data) return { id: null, weekStart, people: defaultPeople, slots: [] };

  const row = weekPlanRowSchema.parse(data);
  return {
    id: row.id,
    weekStart,
    people: row.people,
    slots: row.meal_slots.map((slot) => ({
      day: slot.day,
      meal: slot.meal,
      recipeId: slot.recipe_id,
      peopleOverride: slot.people_override,
    })),
  };
}
