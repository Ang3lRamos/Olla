import type { RecipeCategory } from "@/domain/recipe-categories";
import type { Meal } from "@/domain/week";
import type { PlannedSlot } from "@/domain/week-plan";
import type { AssistantMode } from "./schemas";

export interface CatalogRecipe {
  id: string;
  name: string;
  category: RecipeCategory;
  prepMinutes: number | null;
  costPerServingCop: number;
  ingredientNames: string[];
}

export interface AssistantNote {
  /** Día dentro de la semana (0-6) o null si es de la semana anterior. */
  day: number | null;
  meal: Meal | null;
  body: string;
}

/** Todo lo que el asistente necesita saber, ya calculado por el código. */
export interface AssistantContext {
  mode: AssistantMode;
  instruction: string;
  onlyEmpty: boolean;
  people: number;
  weeklyBudgetCop: number | null;
  /** Mercado estimado actual de la semana (ya descuenta la despensa). */
  currentMarketCop: number;
  exclude: string[];
  slots: PlannedSlot[];
  recipes: CatalogRecipe[];
  pantry: string[];
  /** Lo que el hogar agregó al mercado aparte de las recetas ("pollo extra", "tortillas"). */
  marketExtras: string[];
  /** Lo que la persona compró o tiene y pidió aprovechar ("armar con lo que tengo"). */
  focus: string[];
  notes: AssistantNote[];
}
