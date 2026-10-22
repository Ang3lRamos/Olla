import type { Recipe, RecipeIngredient } from "./types";

export function scaleFactor(baseServings: number, targetServings: number): number {
  if (!(baseServings > 0) || !(targetServings > 0)) {
    throw new RangeError(`Porciones inválidas: base ${baseServings}, objetivo ${targetServings}`);
  }
  return targetServings / baseServings;
}

export function scaleRecipe(recipe: Recipe, targetServings: number): RecipeIngredient[] {
  const factor = scaleFactor(recipe.baseServings, targetServings);
  return recipe.ingredients.map((item) => ({
    ingredientId: item.ingredientId,
    quantity: { amount: item.quantity.amount * factor, unit: item.quantity.unit },
  }));
}
