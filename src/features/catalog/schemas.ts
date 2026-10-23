import { z } from "zod";
import { INGREDIENT_CATEGORIES } from "@/domain/categories";
import { NUTRIENT_KEYS, type NutrientKey } from "@/domain/nutrition-goals";
import { parseDecimal } from "@/lib/decimal-input";

/** Cómo se mide un producto propio: define su unidad base y en qué unidades se puede registrar. */
export const MEASURES = [
  { value: "g", label: "Por peso", hint: "gramos, kilos, libras" },
  { value: "ml", label: "Por volumen", hint: "mililitros, litros, tazas" },
  { value: "unit", label: "Por unidades", hint: "unidades, paquetes" },
] as const;

const nameSchema = z
  .string()
  .trim()
  .min(2, "Escribe el nombre del producto.")
  .max(80, "Hasta 80 caracteres.")
  .transform((name) => name.charAt(0).toLocaleUpperCase("es") + name.slice(1));

export const newIngredientSchema = z.object({
  name: nameSchema,
  category: z.enum(INGREDIENT_CATEGORIES),
  baseUnit: z.enum(["g", "ml", "unit"]),
});

export const ingredientUpdateSchema = z.object({
  id: z.uuid(),
  name: nameSchema,
  category: z.enum(INGREDIENT_CATEGORIES),
});

export type NewIngredientInput = z.input<typeof newIngredientSchema>;
export type IngredientUpdateInput = z.input<typeof ingredientUpdateSchema>;

const MAX_PER_BASIS = 2_000;

const nutrientValue = z
  .unknown()
  .transform((raw) => (raw === "" || raw === null || raw === undefined ? null : parseDecimal(String(raw))))
  .pipe(
    z
      .number({ error: "Escribe un número." })
      .min(0, "No puede ser negativo.")
      .max(MAX_PER_BASIS, "Ese número parece demasiado alto.")
      .nullable(),
  );

/**
 * Lo que dice la tabla nutricional del empaque. Todo vacío = quitar los datos; si hay algo,
 * lo vacío cuenta como 0 (muchas etiquetas no traen azúcares o fibra).
 */
export const ingredientNutrientsSchema = z.object({
  id: z.uuid(),
  values: z.object(
    Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, nutrientValue])) as Record<
      NutrientKey,
      typeof nutrientValue
    >,
  ),
});

export type IngredientNutrientsInput = z.input<typeof ingredientNutrientsSchema>;
