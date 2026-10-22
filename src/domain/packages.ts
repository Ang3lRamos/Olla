import { getIngredient, type IngredientCatalog } from "./catalog";
import { quantityCost, type CostEstimate, type PriceList } from "./costs";
import type { BaseQuantity, Ingredient, IngredientAmount, IngredientPrice } from "./types";
import { toIngredientBase } from "./units";

/** Margen para que 900 g / 450 g no den 2,0000001 paquetes. */
const EPSILON = 1e-9;
const DEFAULT_PACKAGE_LABEL = "paquete";

export interface PurchasePlan {
  /** Paquetes enteros a comprar; null si el precio no describe un empaque (referencia). */
  packages: number | null;
  /** Lo que de verdad entra a la casa: con paquetes, su contenido completo. */
  quantity: BaseQuantity;
  costCop: number | null;
}

/** Contenido de la presentación en la unidad base del ingrediente, si se puede comparar. */
function packageContent(price: IngredientPrice, ingredient: Ingredient, unit: BaseQuantity["unit"]) {
  const content = toIngredientBase(price.per, ingredient);
  return content.unit === unit && content.amount > 0 ? content.amount : null;
}

/**
 * Cómo se compra una cantidad. Con el precio propio del hogar se compran paquetes enteros y
 * se paga cada uno completo; con el de referencia se estima lo justo, porque no sabemos en
 * qué empaque viene.
 */
export function planPurchase(
  toBuy: BaseQuantity,
  ingredient: Ingredient,
  price: IngredientPrice | undefined,
): PurchasePlan {
  if (toBuy.amount === 0) return { packages: 0, quantity: toBuy, costCop: 0 };
  const content = price?.own ? packageContent(price, ingredient, toBuy.unit) : null;
  if (!price || content === null) {
    return { packages: null, quantity: toBuy, costCop: quantityCost(toBuy, ingredient, price) };
  }
  const packages = Math.ceil(toBuy.amount / content - EPSILON);
  return {
    packages,
    quantity: { amount: packages * content, unit: toBuy.unit },
    costCop: packages * price.priceCop,
  };
}

/** Cuántas porciones (tajadas, unidades…) son una cantidad, si la presentación las tiene. */
export function piecesIn(
  quantity: BaseQuantity,
  ingredient: Ingredient,
  price: IngredientPrice | undefined,
): number | null {
  if (!price?.pieces) return null;
  const content = packageContent(price, ingredient, quantity.unit);
  return content === null ? null : (quantity.amount / content) * price.pieces.count;
}

const PIECES_FORMAT = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

/** "≈ 6 tajadas": redondeado a media porción, que es lo que se puede contar en la cocina. */
export function formatPieces(count: number, label: string): string {
  const rounded = Math.round(count * 2) / 2;
  return `${rounded === count ? "" : "≈ "}${PIECES_FORMAT.format(rounded)} ${label}`;
}

/** "paquete" → "paquetes", "unidad" → "unidades". */
function plural(word: string): string {
  return /[aeiouáéíóú]$/i.test(word) ? `${word}s` : `${word}es`;
}

/** "1 paquete", "2 bloques". */
export function formatPackages(count: number, price: IngredientPrice): string {
  const label = price.packageLabel?.trim() || DEFAULT_PACKAGE_LABEL;
  return `${count} ${count === 1 ? label : plural(label)}`;
}

/** Costo del mercado tal como se va a pagar: en paquetes enteros donde el hogar puso su precio. */
export function estimatePurchases(
  toBuy: IngredientAmount[],
  catalog: IngredientCatalog,
  prices: PriceList,
): CostEstimate {
  let total = 0;
  const unpriced = new Set<string>();
  for (const { ingredientId, quantity } of toBuy) {
    const { costCop } = planPurchase(
      quantity,
      getIngredient(catalog, ingredientId),
      prices.get(ingredientId),
    );
    if (costCop === null) unpriced.add(ingredientId);
    else total += costCop;
  }
  return { totalCop: Math.round(total), unpricedIngredientIds: [...unpriced] };
}
