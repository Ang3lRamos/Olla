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

/**
 * Aporte nutricional aproximado de un ingrediente: por 100 g, por 100 ml o por unidad. Es una
 * referencia para estimar, no una medición.
 */
export interface Nutrients {
  basis: "100g" | "100ml" | "unit";
  kcal: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
  fiber: number;
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  /** Unidad en la que se compra y se muestra en el mercado. */
  baseUnit: BaseUnit;
  /** Peso aproximado de una unidad; permite pasar de "2 cebollas" a gramos y viceversa. */
  gramsPerUnit: number | null;
  /** Lo creó el hogar (se puede editar y borrar); los del catálogo de base no. */
  own?: boolean;
  nutrients?: Nutrients | null;
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

/** Porciones que trae una presentación, p. ej. 18 tajadas. */
export interface PackagePieces {
  count: number;
  label: string;
}

/**
 * Precio de un ingrediente por una cantidad. Si lo puso el hogar (`own`), describe lo que de
 * verdad compra —"un paquete de 450 g con 18 tajadas a $9.800"— y el mercado se cuenta en
 * paquetes enteros; el de referencia es solo un promedio para estimar.
 */
export interface IngredientPrice {
  ingredientId: string;
  priceCop: number;
  per: Quantity;
  own?: boolean;
  /** Cómo se llama lo que se compra: "paquete", "bloque", "cubeta"… */
  packageLabel?: string | null;
  pieces?: PackagePieces | null;
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
