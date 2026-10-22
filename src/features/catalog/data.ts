import "server-only";
import { cache } from "react";
import { z } from "zod";
import { buildCatalog, type IngredientCatalog } from "@/domain/catalog";
import { INGREDIENT_CATEGORIES } from "@/domain/categories";
import { buildPriceList, type PriceEntry, type PriceList } from "@/domain/costs";
import type { Ingredient } from "@/domain/types";
import { UNITS } from "@/domain/units";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ingredientRowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    category: z.enum(INGREDIENT_CATEGORIES),
    base_unit: z.enum(["g", "ml", "unit"]),
    grams_per_unit: z.number().nullable(),
  })
  .transform((row): Ingredient => ({
    id: row.id,
    name: row.name,
    category: row.category,
    baseUnit: row.base_unit,
    gramsPerUnit: row.grams_per_unit,
  }));

const priceRowSchema = z
  .object({
    ingredient_id: z.string(),
    household_id: z.string().nullable(),
    price_cop: z.number(),
    per_amount: z.number(),
    per_unit: z.enum(UNITS),
    package_label: z.string().nullable(),
    pieces: z.number().nullable(),
    piece_label: z.string().nullable(),
  })
  .transform((row): PriceEntry => ({
    ingredientId: row.ingredient_id,
    householdId: row.household_id,
    priceCop: row.price_cop,
    per: { amount: row.per_amount, unit: row.per_unit },
    packageLabel: row.package_label,
    pieces: row.pieces && row.piece_label ? { count: row.pieces, label: row.piece_label } : null,
  }));

export interface CatalogData {
  ingredients: Ingredient[];
  catalog: IngredientCatalog;
  prices: PriceList;
  /** Precios crudos: de referencia (householdId nulo) y propios del hogar. */
  priceEntries: PriceEntry[];
}

/** Ingredientes y precios vigentes que ve el hogar: los globales más los propios. */
export const getCatalog = cache(async (): Promise<CatalogData> => {
  const supabase = await createSupabaseServerClient();
  const [ingredientsResult, pricesResult] = await Promise.all([
    supabase.from("ingredients").select("id, name, category, base_unit, grams_per_unit").order("name"),
    supabase
      .from("ingredient_prices")
      .select(
        "ingredient_id, household_id, price_cop, per_amount, per_unit, package_label, pieces, piece_label",
      ),
  ]);
  if (ingredientsResult.error)
    throw new Error(`No se pudo leer el catálogo: ${ingredientsResult.error.message}`);
  if (pricesResult.error) throw new Error(`No se pudieron leer los precios: ${pricesResult.error.message}`);

  const ingredients = z.array(ingredientRowSchema).parse(ingredientsResult.data);
  const priceEntries = z.array(priceRowSchema).parse(pricesResult.data);
  return {
    ingredients,
    catalog: buildCatalog(ingredients),
    prices: buildPriceList(priceEntries),
    priceEntries,
  };
});
