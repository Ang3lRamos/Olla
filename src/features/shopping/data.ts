import "server-only";
import { z } from "zod";
import { INGREDIENT_CATEGORIES, type IngredientCategory } from "@/domain/categories";
import type { Purchase } from "@/domain/shopping-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ShoppingExtra {
  id: string;
  name: string;
  category: IngredientCategory;
  checked: boolean;
}

const purchaseRowSchema = z
  .object({ ingredient_id: z.string(), unit: z.enum(["g", "ml", "unit"]), quantity: z.number() })
  .transform((row): Purchase => ({
    ingredientId: row.ingredient_id,
    quantity: { amount: row.quantity, unit: row.unit },
  }));

const extraRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(INGREDIENT_CATEGORIES),
  checked: z.boolean(),
});

/** Compras y extras de una semana; vacío si la semana aún no existe. */
export async function getShoppingState(weekPlanId: string | null) {
  if (!weekPlanId) return { purchases: [] as Purchase[], extras: [] as ShoppingExtra[] };

  const supabase = await createSupabaseServerClient();
  const [purchases, extras] = await Promise.all([
    supabase
      .from("shopping_purchases")
      .select("ingredient_id, unit, quantity")
      .eq("week_plan_id", weekPlanId),
    supabase
      .from("shopping_extras")
      .select("id, name, category, checked")
      .eq("week_plan_id", weekPlanId)
      .order("created_at"),
  ]);
  if (purchases.error) throw new Error(`No se pudieron leer las compras: ${purchases.error.message}`);
  if (extras.error) throw new Error(`No se pudieron leer los extras: ${extras.error.message}`);

  return {
    purchases: z.array(purchaseRowSchema).parse(purchases.data),
    extras: z.array(extraRowSchema).parse(extras.data),
  };
}
