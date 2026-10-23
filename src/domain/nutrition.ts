import { getIngredient, type IngredientCatalog } from "./catalog";
import { scaleRecipe } from "./scaling";
import type { Ingredient, Nutrients, PlannedMeal, Quantity, Recipe } from "./types";
import { toIngredientBase } from "./units";

export interface NutritionTotals {
  kcal: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
  fiber: number;
}

export interface NutritionEstimate {
  totals: NutritionTotals;
  /** Ingredientes sin datos o sin forma de convertir su cantidad: el total se queda corto. */
  missing: string[];
}

const ZERO: NutritionTotals = { kcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0, fiber: 0 };
const NUTRIENT_KEYS = Object.keys(ZERO) as Array<keyof NutritionTotals>;

/**
 * Cuántas "bases" (100 g, 100 ml o unidades) hay en una cantidad. Entre unidades y gramos
 * solo se convierte si se sabe cuánto pesa una unidad; si no, no se adivina.
 */
function basesIn(quantity: Quantity, ingredient: Ingredient): number | null {
  const basis = ingredient.nutrients?.basis;
  if (!basis) return null;
  const base = toIngredientBase(quantity, ingredient);
  const grams =
    base.unit === "g"
      ? base.amount
      : base.unit === "unit" && ingredient.gramsPerUnit
        ? base.amount * ingredient.gramsPerUnit
        : null;
  switch (basis) {
    case "100g":
      return grams === null ? null : grams / 100;
    case "100ml":
      return base.unit === "ml" ? base.amount / 100 : null;
    case "unit":
      if (base.unit === "unit") return base.amount;
      return grams !== null && ingredient.gramsPerUnit ? grams / ingredient.gramsPerUnit : null;
  }
}

/** Aporte de una cantidad de un ingrediente; null si no hay datos o no se puede convertir. */
export function nutrientsOf(quantity: Quantity, ingredient: Ingredient): NutritionTotals | null {
  const bases = basesIn(quantity, ingredient);
  const reference = ingredient.nutrients;
  if (bases === null || !reference) return null;
  return Object.fromEntries(
    NUTRIENT_KEYS.map((key) => [key, reference[key] * bases]),
  ) as unknown as NutritionTotals;
}

function estimate(
  items: Array<{ ingredientId: string; quantity: Quantity }>,
  catalog: IngredientCatalog,
): NutritionEstimate {
  const totals = { ...ZERO };
  const missing = new Set<string>();
  for (const { ingredientId, quantity } of items) {
    const ingredient = getIngredient(catalog, ingredientId);
    const part = nutrientsOf(quantity, ingredient);
    if (!part) {
      missing.add(ingredient.name);
      continue;
    }
    for (const key of NUTRIENT_KEYS) totals[key] += part[key];
  }
  return { totals, missing: [...missing] };
}

export const divideTotals = (totals: NutritionTotals, by: number): NutritionTotals =>
  Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, totals[key] / by])) as unknown as NutritionTotals;

/** Aporte de una receta para esas porciones, y por porción. */
export function recipeNutrition(recipe: Recipe, servings: number, catalog: IngredientCatalog) {
  const total = estimate(scaleRecipe(recipe, servings), catalog);
  return { ...total, perServing: divideTotals(total.totals, servings) };
}

/**
 * Lo que come una persona cada día con el menú: el total del día entre las personas de cada
 * comida. Devuelve los 7 días, de lunes (0) a domingo (6).
 */
export function dailyNutritionPerPerson(
  meals: PlannedMeal[],
  catalog: IngredientCatalog,
): NutritionEstimate[] {
  return Array.from({ length: 7 }, (_, day) => {
    const totals = { ...ZERO };
    const missing = new Set<string>();
    for (const meal of meals.filter((item) => item.day === day)) {
      const { totals: mealTotals, missing: mealMissing } = estimate(
        scaleRecipe(meal.recipe, meal.servings),
        catalog,
      );
      const perPerson = divideTotals(mealTotals, meal.servings);
      for (const key of NUTRIENT_KEYS) totals[key] += perPerson[key];
      mealMissing.forEach((name) => missing.add(name));
    }
    return { totals, missing: [...missing] };
  });
}

const BASIS_BY_UNIT: Record<Ingredient["baseUnit"], Nutrients["basis"]> = {
  g: "100g",
  ml: "100ml",
  unit: "unit",
};

/** La base en que se leen los datos de un producto: como trae la tabla del empaque. */
export const nutrientBasisFor = (baseUnit: Ingredient["baseUnit"]) => BASIS_BY_UNIT[baseUnit];

/** Datos de un producto propio a partir de lo que escribió el hogar; todo vacío = sin datos. */
export function nutrientsFromLabel(
  values: Record<keyof NutritionTotals, number | null>,
  baseUnit: Ingredient["baseUnit"],
): Nutrients | null {
  if (NUTRIENT_KEYS.every((key) => values[key] === null)) return null;
  const totals = { ...ZERO };
  for (const key of NUTRIENT_KEYS) totals[key] = values[key] ?? 0;
  return { basis: nutrientBasisFor(baseUnit), ...totals };
}

/** Sin plan con nutrición, los valores de referencia no viajan al navegador. */
export const withoutNutrients = (ingredients: Ingredient[]): Ingredient[] =>
  ingredients.map((ingredient) => ({ ...ingredient, nutrients: null }));
