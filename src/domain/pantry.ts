import type { IngredientCatalog } from "./catalog";
import { consolidate } from "./consolidation";
import type { BaseQuantity, Ingredient, IngredientAmount, PantryItem, Quantity } from "./types";
import { toIngredientBase } from "./units";

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

/**
 * Suma (o resta, con delta negativo) a lo que hay en casa, en la unidad base del ingrediente
 * y sin bajar de cero. Devuelve null si lo guardado está en una unidad que no se puede
 * combinar con el cambio (p. ej. unidades sin peso conocido contra gramos).
 */
export function adjustStock(
  current: Quantity | undefined,
  delta: BaseQuantity,
  ingredient: Ingredient,
): BaseQuantity | null {
  const change = toIngredientBase(delta, ingredient);
  const stock = current ? toIngredientBase(current, ingredient) : { amount: 0, unit: change.unit };
  if (stock.unit !== change.unit) return stock.amount === 0 && change.amount > 0 ? change : null;
  const amount = stock.amount + change.amount;
  return { amount: amount < EPSILON ? 0 : amount, unit: stock.unit };
}

/**
 * Lo que había en casa antes de las compras de la semana. Lo comprado entra a la despensa,
 * así que el mercado se calcula contra esto para no contar dos veces lo que ya se compró.
 */
export function stockBeforePurchases(
  pantry: PantryItem[],
  purchases: IngredientAmount[],
  catalog: IngredientCatalog,
): PantryItem[] {
  const bought = new Map(purchases.map((item) => [keyOf(item), item.quantity.amount]));
  return consolidate(pantry, catalog).map((item) => ({
    ingredientId: item.ingredientId,
    quantity: {
      amount: Math.max(item.quantity.amount - (bought.get(keyOf(item)) ?? 0), 0),
      unit: item.quantity.unit,
    },
  }));
}

/**
 * La despensa con las compras que todavía no confirma el servidor: lo marcado como comprado
 * en pantalla ya cuenta como en casa, así la lista responde al instante.
 */
export function withPendingPurchases(
  pantry: PantryItem[],
  saved: IngredientAmount[],
  current: IngredientAmount[],
  catalog: IngredientCatalog,
): PantryItem[] {
  const savedByKey = new Map(saved.map((item) => [keyOf(item), item.quantity.amount]));
  const deltas = new Map<string, IngredientAmount>();
  for (const item of current) {
    const delta = item.quantity.amount - (savedByKey.get(keyOf(item)) ?? 0);
    if (delta !== 0) deltas.set(keyOf(item), { ...item, quantity: { ...item.quantity, amount: delta } });
  }
  // Lo que se desmarcó en pantalla sale de la despensa.
  for (const item of saved) {
    if (!current.some((other) => keyOf(other) === keyOf(item))) {
      deltas.set(keyOf(item), { ...item, quantity: { ...item.quantity, amount: -item.quantity.amount } });
    }
  }
  if (deltas.size === 0) return pantry;
  const stock = consolidate(pantry, catalog);
  for (const delta of deltas.values()) {
    const existing = stock.find((item) => keyOf(item) === keyOf(delta));
    if (existing) existing.quantity.amount = Math.max(existing.quantity.amount + delta.quantity.amount, 0);
    else if (delta.quantity.amount > 0) stock.push(delta);
  }
  return stock;
}
