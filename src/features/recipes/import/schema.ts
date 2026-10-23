import { z } from "zod";
import { MAX_RECIPE_INGREDIENTS, MAX_RECIPE_SERVINGS } from "../schemas";

export const MAX_IMPORT_TEXT = 4000;
export const MIN_IMPORT_TEXT = 30;

/** Lo que se le pide al modelo: leer la receta, sin calcular ni inventar nada. */
export const aiRecipeSchema = z.object({
  name: z.string().trim().min(1).max(80),
  servings: z.coerce.number().int().min(1).max(MAX_RECIPE_SERVINGS).catch(4),
  prepMinutes: z.coerce.number().int().min(1).max(1440).nullable().catch(null),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        quantity: z.coerce.number().positive().nullable().catch(null),
        unit: z.string().trim().max(30).nullable().catch(null),
        note: z.string().trim().max(80).nullable().catch(null),
      }),
    )
    .min(1)
    .max(MAX_RECIPE_INGREDIENTS),
  steps: z.array(z.string().trim().min(1).max(500)).max(30).catch([]),
});

export type AiRecipe = z.infer<typeof aiRecipeSchema>;
