import { z } from "zod";
import { RECIPE_CATEGORIES } from "@/domain/recipe-categories";
import { UNITS } from "@/domain/units";
import { parseDecimal } from "@/lib/decimal-input";

export const MAX_RECIPE_INGREDIENTS = 40;
export const MAX_RECIPE_SERVINGS = 50;

/** Un paso por línea; descarta líneas vacías y numeraciones escritas a mano ("1. "). */
export function parseSteps(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim().replace(/^\d+[.)-]\s*/, ""))
    .filter(Boolean);
}

const ingredientLineSchema = z.object({
  ingredientId: z.uuid({ error: "Elige un ingrediente." }),
  quantity: z
    .unknown()
    .transform(parseDecimal)
    .pipe(
      z
        .number({ error: "Escribe una cantidad." })
        .positive("La cantidad debe ser mayor que cero.")
        .max(100_000, "Esa cantidad parece demasiado grande."),
    ),
  unit: z.enum(UNITS),
  note: z.string().trim().max(120, "La nota puede tener hasta 120 caracteres."),
});

export const recipeFormSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Ponle un nombre a la receta.").max(120, "Hasta 120 caracteres."),
  category: z.enum(RECIPE_CATEGORIES, { error: "Elige una categoría." }),
  baseServings: z.number().int().min(1).max(MAX_RECIPE_SERVINGS),
  prepMinutes: z
    .string()
    .trim()
    .transform((raw) => (raw === "" ? null : Number(raw)))
    .pipe(
      z
        .number({ error: "Escribe los minutos en números." })
        .int("Usa minutos enteros.")
        .min(1, "Debe ser al menos 1 minuto.")
        .max(1440, "Más de un día de preparación parece un error.")
        .nullable(),
    ),
  steps: z
    .string()
    .transform(parseSteps)
    .pipe(
      z
        .array(z.string().max(500, "Cada paso puede tener hasta 500 caracteres."))
        .min(1, "Agrega al menos un paso."),
    ),
  ingredients: z
    .array(ingredientLineSchema)
    .min(1, "Agrega al menos un ingrediente.")
    .max(MAX_RECIPE_INGREDIENTS, `Hasta ${MAX_RECIPE_INGREDIENTS} ingredientes.`),
});

export type RecipeFormInput = z.input<typeof recipeFormSchema>;
export type RecipeFormValues = z.output<typeof recipeFormSchema>;

/** Ruta del error ("ingredients.2.quantity") -> mensaje, para ubicarlo en el formulario. */
export type RecipeFieldErrors = Record<string, string>;

export function flattenRecipeErrors(error: z.ZodError): RecipeFieldErrors {
  const errors: RecipeFieldErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    errors[path] ??= issue.message;
  }
  return errors;
}
