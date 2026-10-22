import type { RecipeCategory } from "@/domain/recipe-categories";
import type { Recipe, RecipeIngredient } from "@/domain/types";

export interface RecipeIngredientLine extends RecipeIngredient {
  note: string | null;
}

export interface RecipeDetail extends Recipe {
  category: RecipeCategory;
  prepMinutes: number | null;
  steps: string[];
  /** Las recetas propias se pueden editar; las del catálogo global solo duplicar. */
  isOwn: boolean;
  ingredients: RecipeIngredientLine[];
}

export interface RecipeSummary {
  id: string;
  name: string;
  category: RecipeCategory;
  prepMinutes: number | null;
  isOwn: boolean;
  costPerServingCop: number;
  /** Hay ingredientes sin precio: el costo es parcial. */
  partialCost: boolean;
  /** Nombre e ingredientes normalizados, para buscar "pollo" y encontrar el sudado. */
  searchText: string;
}
