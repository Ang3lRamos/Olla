import { getIngredient, type IngredientCatalog } from "./catalog";
import type { IngredientAmount, Quantity } from "./types";
import { toIngredientBase } from "./units";

interface QuantifiedItem {
  ingredientId: string;
  quantity: Quantity;
}

/**
 * Suma las cantidades de un mismo ingrediente en su unidad base. Si alguna cantidad
 * no se puede convertir (p. ej. "2 unidades" de algo sin peso por unidad junto a
 * "300 g"), queda como una línea aparte en lugar de mezclarse.
 */
export function consolidate(items: QuantifiedItem[], catalog: IngredientCatalog): IngredientAmount[] {
  const totals = new Map<string, IngredientAmount>();

  for (const item of items) {
    const quantity = toIngredientBase(item.quantity, getIngredient(catalog, item.ingredientId));
    const key = `${item.ingredientId}|${quantity.unit}`;
    const current = totals.get(key);
    if (current) {
      current.quantity.amount += quantity.amount;
    } else {
      totals.set(key, { ingredientId: item.ingredientId, quantity: { ...quantity } });
    }
  }

  return [...totals.values()];
}
