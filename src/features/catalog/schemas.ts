import { z } from "zod";
import { INGREDIENT_CATEGORIES } from "@/domain/categories";

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
