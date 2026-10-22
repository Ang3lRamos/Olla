import type { Quantity } from "./types";
import { UNIT_LABELS, type Unit } from "./units";

const FRACTIONS: Array<[number, string]> = [
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
];
const FRACTION_TOLERANCE = 0.03;

/** Unidades de cocina que se leen mejor con fracciones ("½ taza") que con decimales. */
const FRACTIONAL_UNITS = new Set<Unit>(["lb", "cup", "tbsp", "tsp", "unit"]);

const DECIMALS = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
const METRIC_DECIMALS = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

/** 1.5 -> "1 ½", 0.33 -> "⅓", 2 -> "2", 0.6 -> "0,6" (si no se parece a una fracción común). */
export function formatKitchenNumber(amount: number): string {
  const whole = Math.floor(amount + FRACTION_TOLERANCE);
  const remainder = amount - whole;
  if (Math.abs(remainder) < FRACTION_TOLERANCE) return String(whole);

  const fraction = FRACTIONS.find(([value]) => Math.abs(remainder - value) < FRACTION_TOLERANCE);
  if (!fraction) return DECIMALS.format(amount);
  return whole === 0 ? fraction[1] : `${whole} ${fraction[1]}`;
}

/** Cantidad tal como se lee en una receta: "1 ½ libras", "¼ unidad", "37,5 g". */
export function formatRecipeQuantity({ amount, unit }: Quantity): string {
  const label = UNIT_LABELS[unit];
  if (!FRACTIONAL_UNITS.has(unit)) {
    const format = unit === "kg" || unit === "l" ? METRIC_DECIMALS : DECIMALS;
    return `${format.format(amount)} ${label.singular}`;
  }
  const name = amount > 1 + FRACTION_TOLERANCE ? label.plural : label.singular;
  return `${formatKitchenNumber(amount)} ${name}`;
}
