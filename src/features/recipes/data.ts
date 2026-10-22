import "server-only";
import { cache } from "react";
import { z } from "zod";
import { getIngredient, type IngredientCatalog } from "@/domain/catalog";
import { recipeCost, type PriceList } from "@/domain/costs";
import { RECIPE_CATEGORIES } from "@/domain/recipe-categories";
import { UNITS } from "@/domain/units";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeForSearch } from "./search";
import type { RecipeDetail, RecipeSummary } from "./types";

const RECIPE_COLUMNS =
  "id, household_id, name, category, base_servings, prep_minutes, steps, recipe_ingredients(ingredient_id, quantity, unit, note, position)";

const recipeRowSchema = z
  .object({
    id: z.string(),
    household_id: z.string().nullable(),
    name: z.string(),
    category: z.enum(RECIPE_CATEGORIES),
    base_servings: z.number(),
    prep_minutes: z.number().nullable(),
    steps: z.array(z.string()),
    recipe_ingredients: z.array(
      z.object({
        ingredient_id: z.string(),
        quantity: z.number(),
        unit: z.enum(UNITS),
        note: z.string().nullable(),
        position: z.number(),
      }),
    ),
  })
  .transform((row): RecipeDetail => ({
    id: row.id,
    name: row.name,
    category: row.category,
    baseServings: row.base_servings,
    prepMinutes: row.prep_minutes,
    steps: row.steps,
    isOwn: row.household_id !== null,
    ingredients: [...row.recipe_ingredients]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        ingredientId: item.ingredient_id,
        quantity: { amount: item.quantity, unit: item.unit },
        note: item.note,
      })),
  }));

export const listRecipes = cache(async (): Promise<RecipeDetail[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("recipes").select(RECIPE_COLUMNS).order("name");
  if (error) throw new Error(`No se pudieron leer las recetas: ${error.message}`);
  return z.array(recipeRowSchema).parse(data);
});

export async function getRecipe(id: string): Promise<RecipeDetail | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("recipes").select(RECIPE_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo leer la receta: ${error.message}`);
  return data ? recipeRowSchema.parse(data) : null;
}

export function summarizeRecipe(
  recipe: RecipeDetail,
  catalog: IngredientCatalog,
  prices: PriceList,
): RecipeSummary {
  const cost = recipeCost(recipe, recipe.baseServings, catalog, prices);
  const ingredientNames = recipe.ingredients.map((item) => getIngredient(catalog, item.ingredientId).name);
  return {
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    prepMinutes: recipe.prepMinutes,
    isOwn: recipe.isOwn,
    costPerServingCop: Math.round(cost.totalCop / recipe.baseServings),
    partialCost: cost.unpricedIngredientIds.length > 0,
    searchText: normalizeForSearch([recipe.name, ...ingredientNames].join(" ")),
  };
}
