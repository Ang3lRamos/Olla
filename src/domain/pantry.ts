import type { IngredientCatalog } from "./catalog";
import { consolidate } from "./consolidation";
import type { IngredientAmount, PantryItem } from "./types";

export interface PantryAdjustedAmount extends IngredientAmount {
  /** Cantidad que se cubre con lo que ya hay en casa, en la misma unidad. */
  fromPantry: number;
}

/** Margen para que restas como 0.1 + 0.2 - 0.3 no dejen residuos que obliguen a comprar. */
const EPSILON = 1e-9;

const keyOf = (amount: IngredientAmount) => `${amount.ingredientId}|${amount.quantity.unit}`;

export function subtractPantry(
  required: IngredientAmount[],
  pantry: PantryItem[],
  catalog: IngredientCatalog,
): PantryAdjustedAmount[] {
  const stock = new Map(consolidate(pantry, catalog).map((item) => [keyOf(item), item.quantity.amount]));

  return required.map((item) => {
    const available = Math.max(stock.get(keyOf(item)) ?? 0, 0);
    const fromPantry = Math.min(available, item.quantity.amount);
    const remaining = item.quantity.amount - fromPantry;
    return {
      ingredientId: item.ingredientId,
      quantity: { amount: remaining < EPSILON ? 0 : remaining, unit: item.quantity.unit },
      fromPantry,
    };
  });
}
