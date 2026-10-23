import { z } from "zod";
import { NUTRIENT_KEYS } from "@/domain/nutrition-goals";
import { parseDecimal } from "@/lib/decimal-input";

const MAX_TARGET = 20_000;

/** Una meta por nutriente; vacío = sin meta para ese nutriente. */
export const goalsInputSchema = z
  .array(
    z.object({
      nutrient: z.enum(NUTRIENT_KEYS as [string, ...string[]]),
      target: z
        .unknown()
        .transform((raw) =>
          raw === "" || raw === null || raw === undefined ? null : parseDecimal(String(raw)),
        )
        .pipe(
          z
            .number({ error: "Escribe un número." })
            .positive("Debe ser mayor que cero.")
            .max(MAX_TARGET, "Ese número parece demasiado alto.")
            .nullable(),
        ),
      direction: z.enum(["min", "max"]),
    }),
  )
  .max(NUTRIENT_KEYS.length);

export type GoalsInput = z.input<typeof goalsInputSchema>;
