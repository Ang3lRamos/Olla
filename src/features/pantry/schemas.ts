import { z } from "zod";
import { UNITS } from "@/domain/units";
import { parseDecimal } from "@/lib/decimal-input";

export const pantryItemSchema = z.object({
  ingredientId: z.uuid({ error: "Elige un ingrediente." }),
  quantity: z
    .unknown()
    .transform(parseDecimal)
    .pipe(
      z
        .number({ error: "Escribe una cantidad." })
        .positive("Si ya no queda, quítalo de la despensa.")
        .max(100_000, "Esa cantidad parece demasiado grande."),
    ),
  unit: z.enum(UNITS),
});

export type PantryItemInput = z.input<typeof pantryItemSchema>;
