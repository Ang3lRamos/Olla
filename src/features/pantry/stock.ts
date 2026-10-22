import "server-only";
import { z } from "zod";
import { getIngredient, type IngredientCatalog } from "@/domain/catalog";
import { adjustStock } from "@/domain/pantry";
import type { IngredientAmount } from "@/domain/types";
import { toIngredientBase, UNITS } from "@/domain/units";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const stockRowSchema = z.object({ ingredient_id: z.string(), quantity: z.number(), unit: z.enum(UNITS) });

/** Cambio que se guarda para poder deshacerlo: lo que de verdad entró o salió de la despensa. */
export const stockChangeSchema = z.object({
  ingredientId: z.string(),
  quantity: z.object({ amount: z.number(), unit: z.enum(["g", "ml", "unit"]) }),
});

/**
 * Suma o resta a la despensa del hogar (compras, comidas cocinadas). Nada baja de cero y lo
 * que llega a cero sale de la lista. Devuelve los cambios aplicados, que pueden ser menores
 * que los pedidos si no había tanto en casa; null si no se pudo guardar.
 */
export async function changeStock(
  supabase: Supabase,
  householdId: string,
  changes: IngredientAmount[],
  catalog: IngredientCatalog,
): Promise<IngredientAmount[] | null> {
  const ids = [...new Set(changes.map((change) => change.ingredientId))];
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("pantry_items")
    .select("ingredient_id, quantity, unit")
    .eq("household_id", householdId)
    .in("ingredient_id", ids);
  if (error) return null;

  const stock = new Map(
    z
      .array(stockRowSchema)
      .parse(data)
      .map((row) => [row.ingredient_id, { amount: row.quantity, unit: row.unit }]),
  );
  const applied: IngredientAmount[] = [];
  for (const change of changes) {
    const ingredient = getIngredient(catalog, change.ingredientId);
    const current = stock.get(change.ingredientId);
    const next = adjustStock(current, change.quantity, ingredient);
    if (!next) continue;
    const before = current ? toIngredientBase(current, ingredient).amount : 0;
    stock.set(change.ingredientId, next);
    if (next.amount !== before) {
      applied.push({
        ingredientId: change.ingredientId,
        quantity: { amount: next.amount - before, unit: next.unit },
      });
    }
  }

  const touched = [...new Set(applied.map((change) => change.ingredientId))];
  const now = new Date().toISOString();
  const keep = touched.filter((id) => stock.get(id)!.amount > 0);
  const empty = touched.filter((id) => stock.get(id)!.amount === 0);
  if (keep.length) {
    const { error: saveError } = await supabase.from("pantry_items").upsert(
      keep.map((id) => ({
        household_id: householdId,
        ingredient_id: id,
        quantity: stock.get(id)!.amount,
        unit: stock.get(id)!.unit,
        updated_at: now,
      })),
      { onConflict: "household_id,ingredient_id" },
    );
    if (saveError) return null;
  }
  if (empty.length) {
    const { error: deleteError } = await supabase
      .from("pantry_items")
      .delete()
      .eq("household_id", householdId)
      .in("ingredient_id", empty);
    if (deleteError) return null;
  }
  return applied;
}

/** El mismo cambio en sentido contrario, para deshacer una compra o una comida cocinada. */
export const reverseChanges = (changes: IngredientAmount[]): IngredientAmount[] =>
  changes.map((change) => ({
    ingredientId: change.ingredientId,
    quantity: { amount: -change.quantity.amount, unit: change.quantity.unit },
  }));
