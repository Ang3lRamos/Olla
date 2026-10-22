import { describe, expect, it } from "vitest";
import type { PriceList } from "@/domain/costs";
import { arrozBlanco, catalog } from "@/domain/test-fixtures";
import type { RecipeDetail } from "@/features/recipes/types";
import { buildWeekView, recipeUsage } from "./week-view";

const arroz: RecipeDetail = {
  ...arrozBlanco,
  category: "side",
  prepMinutes: 25,
  steps: ["Cocinar"],
  isOwn: false,
  ingredients: arrozBlanco.ingredients.map((line) => ({ ...line, note: null })),
};
const recipes = new Map([[arroz.id, arroz]]);
const prices: PriceList = new Map([
  ["rice", { ingredientId: "rice", priceCop: 2800, per: { amount: 1, unit: "lb" } }],
]);

const build = (overrides: Partial<Parameters<typeof buildWeekView>[0]> = {}) =>
  buildWeekView({
    weekStart: "2026-10-19",
    today: "2026-10-21",
    people: 4,
    slots: [{ day: 2, meal: "lunch", recipeId: "arroz-blanco", peopleOverride: null }],
    recipes,
    notes: [
      { id: "n1", date: "2026-10-21", meal: "lunch", body: "Sobró arroz" },
      { id: "n2", date: "2026-10-21", meal: null, body: "Llega la abuela" },
    ],
    pantry: [],
    catalog,
    prices,
    ...overrides,
  });

describe("buildWeekView", () => {
  it("arma 7 días con 3 comidas y marca hoy", () => {
    const days = build();
    expect(days).toHaveLength(7);
    expect(days.every((day) => day.cells.length === 3)).toBe(true);
    expect(days.filter((day) => day.isToday).map((day) => day.short)).toEqual(["Mié"]);
  });

  it("ubica la receta, sus porciones, su costo y las notas de cada comida", () => {
    const wednesday = build()[2]!;
    const lunch = wednesday.cells[1]!;
    expect(lunch.recipe).toMatchObject({ name: "Arroz blanco", costCop: 2800, usesPantry: false });
    expect(lunch.servings).toBe(4);
    expect(lunch.notes.map((note) => note.body)).toEqual(["Sobró arroz"]);
    expect(wednesday.dayNotes.map((note) => note.body)).toEqual(["Llega la abuela"]);
    expect(wednesday.cells[0]!.recipe).toBeNull();
  });

  it("escala el costo con las personas propias de la comida y lo señala", () => {
    const lunch = build({
      slots: [{ day: 2, meal: "lunch", recipeId: "arroz-blanco", peopleOverride: 8 }],
    })[2]!.cells[1]!;
    expect(lunch).toMatchObject({ servings: 8, isOverride: true, recipe: { costCop: 5600 } });
  });

  it("indica si la receta usa algo de la despensa", () => {
    const lunch = build({ pantry: [{ ingredientId: "rice", quantity: { amount: 1, unit: "kg" } }] })[2]!
      .cells[1]!;
    expect(lunch.recipe?.usesPantry).toBe(true);
  });
});

describe("recipeUsage", () => {
  it("cuenta repeticiones de cada receta", () => {
    const usage = recipeUsage([
      { day: 0, meal: "lunch", recipeId: "a", peopleOverride: null },
      { day: 1, meal: "lunch", recipeId: "a", peopleOverride: null },
      { day: 1, meal: "dinner", recipeId: "b", peopleOverride: null },
    ]);
    expect(Object.fromEntries(usage)).toEqual({ a: 2, b: 1 });
  });
});
