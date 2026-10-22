import type { Ingredient } from "./types";

export type IngredientCatalog = ReadonlyMap<string, Ingredient>;

export function buildCatalog(ingredients: Ingredient[]): IngredientCatalog {
  return new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
}

export function getIngredient(catalog: IngredientCatalog, id: string): Ingredient {
  const ingredient = catalog.get(id);
  if (!ingredient) throw new Error(`Ingrediente desconocido: ${id}`);
  return ingredient;
}
