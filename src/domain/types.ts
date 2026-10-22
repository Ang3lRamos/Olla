import type { Unit, BaseUnit } from "./units";
import type { IngredientCategory } from "./categories";

export interface Quantity {
  amount: number;
  unit: Unit;
}

export interface BaseQuantity {
  amount: number;
  unit: BaseUnit;
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  /** Unidad en la que se compra y se muestra en el mercado. */
  baseUnit: BaseUnit;
  /** Peso aproximado de una unidad; permite pasar de "2 cebollas" a gramos y viceversa. */
  gramsPerUnit: number | null;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: Quantity;
}

export interface Recipe {
  id: string;
  name: string;
  baseServings: number;
  ingredients: RecipeIngredient[];
}

export interface PantryItem {
  ingredientId: string;
  quantity: Quantity;
}

export interface IngredientPrice {
  ingredientId: string;
  priceCop: number;
  per: Quantity;
}

export interface PlannedMeal {
  day: number;
  recipe: Recipe;
  servings: number;
}

export interface IngredientAmount {
  ingredientId: string;
  quantity: BaseQuantity;
}
