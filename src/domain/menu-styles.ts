import { getIngredient, type IngredientCatalog } from "./catalog";
import { recipeCost, type PriceList } from "./costs";
import { recipeNutrition } from "./nutrition";
import type { Ingredient, Quantity, Recipe } from "./types";
import { toIngredientBase } from "./units";

/**
 * Estilos para orientar el menú de la semana. Solo ordenan las recetas con estimaciones: no son
 * metas, dietas ni recomendaciones.
 */
export const MENU_STYLES = ["protein", "vegetables", "light", "budget"] as const;
export type MenuStyle = (typeof MENU_STYLES)[number];

export const MENU_STYLE_LABELS: Record<MenuStyle, string> = {
  protein: "Más proteína",
  vegetables: "Más verduras",
  light: "Porciones ligeras",
  budget: "Rinde más",
};

/** Los que se estiman con los datos de nutrición, que son de los planes pagos. */
export const NUTRITION_STYLES: ReadonlySet<MenuStyle> = new Set(["protein", "light"]);

/** Peso de una cantidad; lo que se cuenta por unidades sin peso conocido no suma. */
function gramsOf(quantity: Quantity, ingredient: Ingredient): number {
  const base = toIngredientBase(quantity, ingredient);
  if (base.unit === "g") return base.amount;
  return base.unit === "unit" && ingredient.gramsPerUnit ? base.amount * ingredient.gramsPerUnit : 0;
}

/** Cuánto encaja una receta en el estilo, por porción; más alto encaja mejor. */
export function styleScore(
  style: MenuStyle,
  recipe: Recipe,
  catalog: IngredientCatalog,
  prices: PriceList,
): number {
  const servings = recipe.baseServings;
  switch (style) {
    case "protein":
      return recipeNutrition(recipe, servings, catalog).perServing.protein;
    case "light": {
      const { perServing, missing } = recipeNutrition(recipe, servings, catalog);
      // Sin datos de un ingrediente, la estimación se queda corta: no se la premia por "ligera".
      return missing.length > 0 ? -Infinity : -perServing.kcal;
    }
    case "vegetables": {
      const grams = recipe.ingredients
        .map((line) => ({ line, ingredient: getIngredient(catalog, line.ingredientId) }))
        .filter(({ ingredient }) => ingredient.category === "vegetables")
        .reduce((sum, { line, ingredient }) => sum + gramsOf(line.quantity, ingredient), 0);
      return grams / servings;
    }
    case "budget":
      return -recipeCost(recipe, servings, catalog, prices).totalCop / servings;
  }
}

const LEVELS = 5;

/**
 * Lleva los puntajes a niveles del 1 al 5 (5 = encaja mejor), por posición entre las recetas.
 * Así el modelo y las reglas comparan sin depender de la escala de cada estilo.
 */
export function styleLevels(scores: number[]): number[] {
  const sorted = [...scores].sort((a, b) => a - b);
  return scores.map((score) => {
    const below = sorted.findIndex((value) => value === score);
    return scores.length <= 1 ? LEVELS : 1 + Math.round((below / (scores.length - 1)) * (LEVELS - 1));
  });
}
