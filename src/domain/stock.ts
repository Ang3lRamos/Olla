import type { IngredientCatalog } from "./catalog";
import { consolidate } from "./consolidation";
import { scaleRecipe } from "./scaling";
import type { IngredientAmount, PantryItem, PlannedMeal, Recipe } from "./types";

/** Lo que queda en casa de cada ingrediente, por ingrediente y unidad base. */
export type Stock = ReadonlyMap<string, number>;

const EPSILON = 1e-9;

const keyOf = (amount: IngredientAmount) => `${amount.ingredientId}|${amount.quantity.unit}`;

const needsOf = (recipe: Recipe, servings: number, catalog: IngredientCatalog) =>
  consolidate(scaleRecipe(recipe, servings), catalog);

/** La misma despensa con esa receta ya cocinada; nada baja de cero. */
export function withdraw(stock: Stock, recipe: Recipe, servings: number, catalog: IngredientCatalog): Stock {
  const next = new Map(stock);
  for (const need of needsOf(recipe, servings, catalog)) {
    const left = next.get(keyOf(need));
    if (left !== undefined) next.set(keyOf(need), Math.max(left - need.quantity.amount, 0));
  }
  return next;
}

/** Lo que queda en casa después de las comidas que ya están en el menú. */
export function stockAfter(pantry: PantryItem[], meals: PlannedMeal[], catalog: IngredientCatalog): Stock {
  const stock: Stock = new Map(
    consolidate(pantry, catalog).map((item) => [keyOf(item), item.quantity.amount]),
  );
  return meals.reduce((current, meal) => withdraw(current, meal.recipe, meal.servings, catalog), stock);
}

/**
 * Los ingredientes de la receta que no alcanzan con lo que queda. Solo se limita lo que está en
 * la despensa: lo que no hay en casa se compra, y no se compara si la unidad no se puede convertir.
 */
export function shortages(
  stock: Stock,
  recipe: Recipe,
  servings: number,
  catalog: IngredientCatalog,
  counts: (ingredientId: string) => boolean,
): string[] {
  return needsOf(recipe, servings, catalog)
    .filter((need) => {
      const left = stock.get(keyOf(need));
      return counts(need.ingredientId) && left !== undefined && left + EPSILON < need.quantity.amount;
    })
    .map((need) => need.ingredientId);
}
