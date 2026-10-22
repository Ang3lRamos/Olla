import type { BaseQuantity, Ingredient, Quantity } from "./types";
import { toIngredientBase } from "./units";

/**
 * Cómo ve las cantidades cada hogar. "simple": lo principal en medidas de cocina y los
 * condimentos "al gusto". "detailed": cada cantidad exacta. Los costos y el mercado se
 * calculan igual en los dos: solo cambia lo que se muestra.
 */
export const DETAIL_LEVELS = ["simple", "detailed"] as const;
export type DetailLevel = (typeof DETAIL_LEVELS)[number];

/** Lo que casi nadie mide en casa, aunque la receta lo tenga en gramos. */
const SEASONING_NAMES = new Set(["ajo", "sal", "aceite vegetal", "caldo en cubo", "cilantro"]);

export const isSeasoning = (ingredient: Pick<Ingredient, "name" | "category">) =>
  ingredient.category === "spices" || SEASONING_NAMES.has(ingredient.name.trim().toLocaleLowerCase("es"));

const roundTo = (amount: number, step: number) => Math.max(Math.round(amount / step) * step, step);

const GRAMS_PER_POUND = 500;
const ML_PER_CUP = 240;
const ML_PER_TABLESPOON = 15;

/**
 * La misma cantidad en medidas de cocina: libras por cuartos desde media libra, gramos de 25 en
 * 25 por debajo; tazas por cuartos desde media taza, cucharadas por mitades por debajo; unidades
 * de media en media. Es para leer, no para calcular.
 */
export function toKitchenQuantity(quantity: Quantity, ingredient: Ingredient): Quantity {
  const base = toIngredientBase(quantity, ingredient);
  switch (base.unit) {
    case "g":
      return base.amount >= GRAMS_PER_POUND / 2
        ? { amount: roundTo(base.amount / GRAMS_PER_POUND, 0.25), unit: "lb" }
        : { amount: roundTo(base.amount, 25), unit: "g" };
    case "ml":
      return base.amount >= ML_PER_CUP / 2
        ? { amount: roundTo(base.amount / ML_PER_CUP, 0.25), unit: "cup" }
        : { amount: roundTo(base.amount / ML_PER_TABLESPOON, 0.5), unit: "tbsp" };
    case "unit":
      return { amount: roundTo(base.amount, 0.5), unit: "unit" };
  }
}

/** Equivalente exacto en gramos o mililitros, para el modo detallado ("1 ½ libras (750 g)"). */
export function exactBaseQuantity(quantity: Quantity, ingredient: Ingredient): BaseQuantity | null {
  const base = toIngredientBase(quantity, ingredient);
  return base.unit === "unit" || base.unit === quantity.unit ? null : base;
}
