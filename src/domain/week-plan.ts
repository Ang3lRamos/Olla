import type { IngredientCatalog } from "./catalog";
import { dailyCosts, type CostEstimate, type PriceList } from "./costs";
import { estimatePurchases } from "./packages";
import { buildShoppingLines } from "./shopping-list";
import type { PantryItem, PlannedMeal, Recipe } from "./types";
import { MEALS, type Meal } from "./week";

export interface PlannedSlot {
  day: number;
  meal: Meal;
  recipeId: string;
  /** Personas distintas a las de la semana para esta comida (p. ej. visita el sábado). */
  peopleOverride: number | null;
  /** Ya se cocinó: sus ingredientes salieron de la despensa y no cuentan para el mercado. */
  cooked?: boolean;
}

export interface WeekSummary {
  plannedMeals: number;
  totalMeals: number;
  /** Lo que falta comprar para lo que aún no se cocina: descuenta la despensa, en paquetes. */
  market: CostEstimate;
  /** Valor de lo que se cocina cada día, de lunes a domingo. */
  days: CostEstimate[];
  averagePerPlannedDayCop: number;
}

export function toPlannedMeals(
  slots: PlannedSlot[],
  recipes: ReadonlyMap<string, Recipe>,
  weekPeople: number,
): PlannedMeal[] {
  return slots.flatMap((slot) => {
    const recipe = recipes.get(slot.recipeId);
    return recipe ? [{ day: slot.day, recipe, servings: slot.peopleOverride ?? weekPeople }] : [];
  });
}

interface SummarizeWeekInput {
  slots: PlannedSlot[];
  recipes: ReadonlyMap<string, Recipe>;
  weekPeople: number;
  pantry: PantryItem[];
  catalog: IngredientCatalog;
  prices: PriceList;
}

export function summarizeWeek({
  slots,
  recipes,
  weekPeople,
  pantry,
  catalog,
  prices,
}: SummarizeWeekInput): WeekSummary {
  const meals = toPlannedMeals(slots, recipes, weekPeople);
  const days = dailyCosts(meals, catalog, prices);
  const pending = toPlannedMeals(
    slots.filter((slot) => !slot.cooked),
    recipes,
    weekPeople,
  );
  const toBuy = buildShoppingLines(pending, pantry, catalog).map((line) => ({
    ingredientId: line.ingredientId,
    quantity: line.toBuy,
  }));
  const plannedDays = days.filter((_, day) => meals.some((meal) => meal.day === day)).length;
  const cookedValue = days.reduce((sum, day) => sum + day.totalCop, 0);

  return {
    plannedMeals: meals.length,
    totalMeals: 7 * MEALS.length,
    market: estimatePurchases(toBuy, catalog, prices),
    days,
    averagePerPlannedDayCop: plannedDays === 0 ? 0 : Math.round(cookedValue / plannedDays),
  };
}
