import { CATEGORY_LABELS, INGREDIENT_CATEGORIES, type IngredientCategory } from "./categories";
import { getIngredient, type IngredientCatalog } from "./catalog";
import { consolidate } from "./consolidation";
import { subtractPantry } from "./pantry";
import { scaleRecipe } from "./scaling";
import type { BaseQuantity, PantryItem, PlannedMeal } from "./types";

export interface ShoppingLine {
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  needed: BaseQuantity;
  fromPantry: number;
  toBuy: BaseQuantity;
}

export interface ShoppingGroup {
  category: IngredientCategory;
  label: string;
  lines: ShoppingLine[];
}

/** No se compra media cebolla ni 312,5 g exactos: se redondea hacia arriba. */
function roundUpForPurchase(amount: number): number {
  return amount === 0 ? 0 : Math.ceil(amount - 1e-9);
}

export function buildShoppingLines(
  meals: PlannedMeal[],
  pantry: PantryItem[],
  catalog: IngredientCatalog,
): ShoppingLine[] {
  const scaled = meals.flatMap((meal) => scaleRecipe(meal.recipe, meal.servings));
  const needed = consolidate(scaled, catalog);
  const adjusted = subtractPantry(needed, pantry, catalog);

  return adjusted.map((item, index) => {
    const ingredient = getIngredient(catalog, item.ingredientId);
    return {
      ingredientId: item.ingredientId,
      name: ingredient.name,
      category: ingredient.category,
      needed: needed[index]!.quantity,
      fromPantry: item.fromPantry,
      toBuy: { amount: roundUpForPurchase(item.quantity.amount), unit: item.quantity.unit },
    };
  });
}

export function groupByCategory(lines: ShoppingLine[]): ShoppingGroup[] {
  const byName = (a: ShoppingLine, b: ShoppingLine) => a.name.localeCompare(b.name, "es");

  return INGREDIENT_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    lines: lines.filter((line) => line.category === category).sort(byName),
  })).filter((group) => group.lines.length > 0);
}
