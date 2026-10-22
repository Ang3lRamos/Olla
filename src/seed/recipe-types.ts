import type { RecipeCategory } from "@/domain/recipe-categories";
import type { Unit } from "@/domain/units";
import type { SeedIngredientKey } from "./ingredients";

export interface SeedRecipeIngredient {
  key: SeedIngredientKey;
  amount: number;
  unit: Unit;
  note?: string;
}

export interface SeedRecipe {
  name: string;
  category: RecipeCategory;
  baseServings: number;
  prepMinutes: number;
  ingredients: SeedRecipeIngredient[];
  steps: string[];
}

export const item = (
  key: SeedIngredientKey,
  amount: number,
  unit: Unit,
  note?: string,
): SeedRecipeIngredient => (note ? { key, amount, unit, note } : { key, amount, unit });
