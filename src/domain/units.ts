import type { BaseQuantity, Ingredient, Quantity } from "./types";

export const UNITS = ["g", "kg", "lb", "ml", "l", "cup", "tbsp", "tsp", "unit"] as const;
export type Unit = (typeof UNITS)[number];
export type BaseUnit = "g" | "ml" | "unit";

const UNIT_TO_BASE: Record<Unit, { base: BaseUnit; factor: number }> = {
  g: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  // En Colombia la libra de mercado es de 500 g, no la libra imperial.
  lb: { base: "g", factor: 500 },
  ml: { base: "ml", factor: 1 },
  l: { base: "ml", factor: 1000 },
  cup: { base: "ml", factor: 240 },
  tbsp: { base: "ml", factor: 15 },
  tsp: { base: "ml", factor: 5 },
  unit: { base: "unit", factor: 1 },
};

export const UNIT_LABELS: Record<Unit, { singular: string; plural: string }> = {
  g: { singular: "g", plural: "g" },
  kg: { singular: "kg", plural: "kg" },
  lb: { singular: "libra", plural: "libras" },
  ml: { singular: "ml", plural: "ml" },
  l: { singular: "L", plural: "L" },
  cup: { singular: "taza", plural: "tazas" },
  tbsp: { singular: "cucharada", plural: "cucharadas" },
  tsp: { singular: "cucharadita", plural: "cucharaditas" },
  unit: { singular: "unidad", plural: "unidades" },
};

/** Para elegir la unidad se lee el nombre completo; al mostrar cantidades, la abreviatura. */
export const UNIT_NAMES: Record<Unit, string> = {
  g: "gramos",
  kg: "kilos",
  lb: "libras",
  ml: "mililitros",
  l: "litros",
  cup: "tazas",
  tbsp: "cucharadas",
  tsp: "cucharaditas",
  unit: "unidades",
};

export function toBase(quantity: Quantity): BaseQuantity {
  const { base, factor } = UNIT_TO_BASE[quantity.unit];
  return { amount: quantity.amount * factor, unit: base };
}

/**
 * Lleva una cantidad a la unidad base del ingrediente. Entre unidades y gramos solo
 * convierte si el ingrediente tiene `gramsPerUnit`; si no hay conversión posible,
 * devuelve la cantidad en su propia unidad base para no inventar equivalencias.
 */
export function toIngredientBase(quantity: Quantity, ingredient: Ingredient): BaseQuantity {
  const base = toBase(quantity);
  if (base.unit === ingredient.baseUnit || ingredient.gramsPerUnit === null) return base;

  if (base.unit === "unit" && ingredient.baseUnit === "g") {
    return { amount: base.amount * ingredient.gramsPerUnit, unit: "g" };
  }
  if (base.unit === "g" && ingredient.baseUnit === "unit") {
    return { amount: base.amount / ingredient.gramsPerUnit, unit: "unit" };
  }
  return base;
}

const NUMBER_FORMAT = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

/** Formato legible: pasa a kg o l desde 1000 y usa singular o plural en unidades. */
export function formatQuantity(quantity: BaseQuantity): string {
  const { amount, unit } = quantity;
  if (unit === "g" && amount >= 1000) return `${NUMBER_FORMAT.format(amount / 1000)} kg`;
  if (unit === "ml" && amount >= 1000) return `${NUMBER_FORMAT.format(amount / 1000)} L`;

  if (unit !== "unit") return `${NUMBER_FORMAT.format(amount)} ${unit}`;
  const { singular, plural } = UNIT_LABELS.unit;
  return `${NUMBER_FORMAT.format(amount)} ${amount === 1 ? singular : plural}`;
}

const MASS_UNITS: Unit[] = ["g", "kg", "lb"];
const VOLUME_UNITS: Unit[] = ["ml", "l", "cup", "tbsp", "tsp"];

/** Unidades en las que tiene sentido registrar un ingrediente, empezando por la suya. */
export function compatibleUnits(ingredient: Ingredient): Unit[] {
  const convertible = ingredient.gramsPerUnit !== null;
  switch (ingredient.baseUnit) {
    case "g":
      return convertible ? [...MASS_UNITS, "unit"] : MASS_UNITS;
    case "ml":
      return VOLUME_UNITS;
    case "unit":
      return convertible ? ["unit", ...MASS_UNITS] : ["unit"];
  }
}
