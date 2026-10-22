"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { consolidate } from "@/domain/consolidation";
import { scaleRecipe } from "@/domain/scaling";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { changeStock, reverseChanges, stockChangeSchema } from "@/features/pantry/stock";
import { getRecipe } from "@/features/recipes/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WeekActionResult } from "./actions";
import { slotKeySchema, type SlotKey } from "./schemas";
import { findWeekPlanId } from "./week-plan-id";

const SAVE_ERROR = "No pudimos actualizar la despensa. Revisa tu conexión y vuelve a intentarlo.";
const INVALID = "Esa comida no está en la semana.";

const done = (): WeekActionResult => {
  // La despensa cambia: se ve en la semana, el mercado y la propia despensa.
  revalidatePath("/", "layout");
  return { ok: true };
};

async function findSlot(input: SlotKey) {
  const parsed = slotKeySchema.safeParse(input);
  if (!parsed.success) return null;
  const supabase = await createSupabaseServerClient();
  const weekPlanId = await findWeekPlanId(supabase, parsed.data.weekStart);
  if (!weekPlanId) return null;
  const { data } = await supabase
    .from("meal_slots")
    .select("id, recipe_id, people_override, cooked_at, cooked_deductions, week_plans(people)")
    .eq("week_plan_id", weekPlanId)
    .eq("day", parsed.data.day)
    .eq("meal", parsed.data.meal)
    .maybeSingle();
  return data ? { supabase, slot: data } : null;
}

/** "Ya la cocinamos": descuenta de la despensa lo que usó la receta para esas personas. */
export async function cookMeal(input: SlotKey): Promise<WeekActionResult> {
  const household = await requireHousehold();
  const found = await findSlot(input);
  if (!found) return { ok: false, error: INVALID };
  const { supabase, slot } = found;
  if (slot.cooked_at) return done();

  const [recipe, { catalog }] = await Promise.all([getRecipe(slot.recipe_id), getCatalog()]);
  if (!recipe) return { ok: false, error: INVALID };
  const servings = slot.people_override ?? slot.week_plans?.people ?? household.defaultPeople;
  const used = consolidate(scaleRecipe(recipe, servings), catalog);

  const applied = await changeStock(supabase, household.id, reverseChanges(used), catalog);
  if (!applied) return { ok: false, error: SAVE_ERROR };
  const { error } = await supabase
    .from("meal_slots")
    .update({
      cooked_at: new Date().toISOString(),
      cooked_deductions: applied.map(({ ingredientId, quantity }) => ({
        ingredientId,
        quantity: { ...quantity },
      })),
    })
    .eq("id", slot.id);
  return error ? { ok: false, error: SAVE_ERROR } : done();
}

/** Deshace "Ya la cocinamos": devuelve a la despensa exactamente lo que se había descontado. */
export async function uncookMeal(input: SlotKey): Promise<WeekActionResult> {
  const household = await requireHousehold();
  const found = await findSlot(input);
  if (!found) return { ok: false, error: INVALID };
  const { supabase, slot } = found;
  if (!slot.cooked_at) return done();

  const deductions = z.array(stockChangeSchema).safeParse(slot.cooked_deductions);
  const { catalog } = await getCatalog();
  const restored = await changeStock(
    supabase,
    household.id,
    reverseChanges(deductions.success ? deductions.data : []),
    catalog,
  );
  if (!restored) return { ok: false, error: SAVE_ERROR };
  const { error } = await supabase
    .from("meal_slots")
    .update({ cooked_at: null, cooked_deductions: [] })
    .eq("id", slot.id);
  return error ? { ok: false, error: SAVE_ERROR } : done();
}
