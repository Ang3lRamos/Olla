import { z } from "zod";
import { UNITS } from "@/domain/units";
import { parseDecimal } from "@/lib/decimal-input";

const MAX_PRICE_COP = 10_000_000;

/** "$ 3.500" -> 3500. Los pesos no llevan decimales. */
export function parsePriceCop(raw: unknown): number {
  if (typeof raw === "number") return raw;
  const digits = typeof raw === "string" ? raw.replace(/\D/g, "") : "";
  return digits === "" ? Number.NaN : Number(digits);
}

export const ingredientPriceSchema = z.object({
  ingredientId: z.uuid(),
  priceCop: z
    .unknown()
    .transform(parsePriceCop)
    .pipe(
      z
        .number({ error: "Escribe el precio en pesos." })
        .int()
        .min(0, "El precio no puede ser negativo.")
        .max(MAX_PRICE_COP, "Ese precio parece demasiado alto."),
    ),
  perAmount: z
    .unknown()
    .transform(parseDecimal)
    .pipe(z.number({ error: "Escribe la cantidad." }).positive("La cantidad debe ser mayor que cero.")),
  perUnit: z.enum(UNITS),
});

export type IngredientPriceInput = z.input<typeof ingredientPriceSchema>;
