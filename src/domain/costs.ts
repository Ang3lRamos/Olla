import { getIngredient, type IngredientCatalog } from "./catalog";
import { consolidate } from "./consolidation";
import { scaleRecipe } from "./scaling";
import type {
  BaseQuantity,
  Ingredient,
  IngredientAmount,
  IngredientPrice,
  PlannedMeal,
  Recipe,
} from "./types";
import { toIngredientBase } from "./units";

export type PriceList = ReadonlyMap<string, IngredientPrice>;

export interface CostEstimate {
  totalCop: number;
  /** Ingredientes sin precio o con un precio en una unidad que no se puede convertir. */
  unpricedIngredientIds: string[];
}

export const DAYS_IN_WEEK = 7;

export interface PriceEntry extends IngredientPrice {
  /** null = precio de referencia del catálogo global. */
  householdId: string | null;
}

/** El precio propio del hogar reemplaza al de referencia del mismo ingrediente. */
export function buildPriceList(entries: PriceEntry[]): PriceList {
  const prices = new Map<string, IngredientPrice>();
  const referenceFirst = [...entries].sort(
    (a, b) => Number(a.householdId !== null) - Number(b.householdId !== null),
  );
  for (const { householdId, ...price } of referenceFirst) {
    prices.set(price.ingredientId, { ...price, own: householdId !== null });
  }
  return prices;
}

/** Costo de una cantidad, o null si no hay precio o las unidades no son compatibles. */
export function quantityCost(
  quantity: BaseQuantity,
  ingredient: Ingredient,
  price: IngredientPrice | undefined,
): number | null {
  if (!price) return null;
  const per = toIngredientBase(price.per, ingredient);
  const amount = toIngredientBase(quantity, ingredient);
  if (per.unit !== amount.unit || per.amount <= 0) return null;
  return (amount.amount / per.amount) * price.priceCop;
}

export function estimateCost(
  amounts: IngredientAmount[],
  catalog: IngredientCatalog,
  prices: PriceList,
): CostEstimate {
  let total = 0;
  const unpriced = new Set<string>();

  for (const { ingredientId, quantity } of amounts) {
    if (quantity.amount === 0) continue;
    const cost = quantityCost(quantity, getIngredient(catalog, ingredientId), prices.get(ingredientId));
    if (cost === null) unpriced.add(ingredientId);
    else total += cost;
  }

  return { totalCop: Math.round(total), unpricedIngredientIds: [...unpriced] };
}

export function recipeCost(
  recipe: Recipe,
  servings: number,
  catalog: IngredientCatalog,
  prices: PriceList,
): CostEstimate {
  return estimateCost(consolidate(scaleRecipe(recipe, servings), catalog), catalog, prices);
}

/**
 * Valor de lo que se cocina cada día (sin descontar la despensa), para ver qué días
 * salen más caros. Devuelve siempre los 7 días, de lunes (0) a domingo (6).
 */
export function dailyCosts(
  meals: PlannedMeal[],
  catalog: IngredientCatalog,
  prices: PriceList,
): CostEstimate[] {
  return Array.from({ length: DAYS_IN_WEEK }, (_, day) => {
    const items = meals
      .filter((meal) => meal.day === day)
      .flatMap((meal) => scaleRecipe(meal.recipe, meal.servings));
    return estimateCost(consolidate(items, catalog), catalog, prices);
  });
}
