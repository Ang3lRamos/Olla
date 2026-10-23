import "server-only";
import { z } from "zod";
import { NUTRIENT_KEYS, type NutritionGoal } from "@/domain/nutrition-goals";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const goalRowSchema = z
  .object({
    nutrient: z.enum(NUTRIENT_KEYS as [NutritionGoal["nutrient"], ...NutritionGoal["nutrient"][]]),
    target: z.coerce.number(),
    direction: z.enum(["min", "max"]),
  })
  .transform((row): NutritionGoal => row);

/** Las metas de la persona que entró (no del hogar); la RLS solo devuelve las suyas. */
export async function getMyGoals(): Promise<NutritionGoal[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("nutrition_goals").select("nutrient, target, direction");
  if (error) throw new Error(`No se pudieron leer las metas: ${error.message}`);
  return z.array(goalRowSchema).parse(data);
}
