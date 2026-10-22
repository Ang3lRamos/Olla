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

const MAX_PIECES = 1000;

/** Texto opcional: vacío cuenta como "no dijo". */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || null);

const optionalPieces = z
  .unknown()
  .transform((raw) => (raw === "" || raw === null || raw === undefined ? null : Number(raw)))
  .pipe(
    z
      .number({ error: "Escribe cuántas porciones trae." })
      .int("Las porciones van en números enteros.")
      .min(1, "Debe traer al menos una porción.")
      .max(MAX_PIECES, "Son demasiadas porciones.")
      .nullable(),
  );

export const ingredientPriceSchema = z
  .object({
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
    /** Cómo se llama lo que se compra: "paquete", "bloque"… */
    packageLabel: optionalText(30, "Hasta 30 caracteres."),
    pieces: optionalPieces.optional().transform((value) => value ?? null),
    pieceLabel: optionalText(20, "Hasta 20 caracteres."),
  })
  .refine((input) => input.pieces === null || input.pieceLabel !== null, {
    message: "Escribe cómo se llaman las porciones (p. ej. tajadas).",
    path: ["pieceLabel"],
  })
  .transform((input) => (input.pieces === null ? { ...input, pieceLabel: null } : input));

export type IngredientPriceInput = z.input<typeof ingredientPriceSchema>;
