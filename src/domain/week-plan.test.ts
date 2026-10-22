import { describe, expect, it } from "vitest";
import type { PriceList } from "./costs";
import { arrozBlanco, catalog, huevosPericos } from "./test-fixtures";
import type { Recipe } from "./types";
import { summarizeWeek, toPlannedMeals, type PlannedSlot } from "./week-plan";

const recipes = new Map<string, Recipe>([
  [arrozBlanco.id, arrozBlanco],
  [huevosPericos.id, huevosPericos],
]);

const prices: PriceList = new Map([
  ["rice", { ingredientId: "rice", priceCop: 2800, per: { amount: 1, unit: "lb" } }],
  ["oil", { ingredientId: "oil", priceCop: 12000, per: { amount: 1, unit: "l" } }],
  ["onion", { ingredientId: "onion", priceCop: 1000, per: { amount: 1, unit: "unit" } }],
  ["egg", { ingredientId: "egg", priceCop: 18000, per: { amount: 30, unit: "unit" } }],
  ["tomato", { ingredientId: "tomato", priceCop: 4000, per: { amount: 1, unit: "kg" } }],
]);

const slots: PlannedSlot[] = [
  { day: 0, meal: "lunch", recipeId: "arroz-blanco", peopleOverride: null },
  { day: 0, meal: "breakfast", recipeId: "huevos-pericos", peopleOverride: 2 },
  { day: 2, meal: "lunch", recipeId: "arroz-blanco", peopleOverride: null },
];

describe("toPlannedMeals", () => {
  it("usa las personas de la semana salvo que la comida tenga otras", () => {
    expect(toPlannedMeals(slots, recipes, 4).map((meal) => meal.servings)).toEqual([4, 2, 4]);
  });

  it("ignora recetas que ya no existen", () => {
    expect(
      toPlannedMeals([{ day: 1, meal: "lunch", recipeId: "borrada", peopleOverride: null }], recipes, 4),
    ).toEqual([]);
  });
});

describe("summarizeWeek", () => {
  it("resume comidas, costo por día, mercado y promedio de los días planeados", () => {
    const summary = summarizeWeek({ slots, recipes, weekPeople: 4, pantry: [], catalog, prices });
    expect(summary.plannedMeals).toBe(3);
    expect(summary.totalMeals).toBe(21);
    expect(summary.days.map((day) => day.totalCop)).toEqual([3660 + 3300, 0, 3660, 0, 0, 0, 0]);
    expect(summary.averagePerPlannedDayCop).toBe(Math.round((3660 + 3300 + 3660) / 2));
    expect(summary.market.totalCop).toBeGreaterThan(0);
  });

  it("el mercado descuenta lo que hay en la despensa", () => {
    const withoutPantry = summarizeWeek({ slots, recipes, weekPeople: 4, pantry: [], catalog, prices });
    const withRice = summarizeWeek({
      slots,
      recipes,
      weekPeople: 4,
      pantry: [{ ingredientId: "rice", quantity: { amount: 1, unit: "kg" } }],
      catalog,
      prices,
    });
    expect(withoutPantry.market.totalCop - withRice.market.totalCop).toBe(5600);
  });

  it("una semana vacía vale cero", () => {
    const summary = summarizeWeek({ slots: [], recipes, weekPeople: 4, pantry: [], catalog, prices });
    expect(summary).toMatchObject({ plannedMeals: 0, averagePerPlannedDayCop: 0, market: { totalCop: 0 } });
  });
});
