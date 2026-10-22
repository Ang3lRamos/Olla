import { describe, expect, it } from "vitest";
import type { PriceList } from "@/domain/costs";
import { arrozBlanco, catalog, huevosPericos } from "@/domain/test-fixtures";
import type { Recipe } from "@/domain/types";
import { buildShoppingView } from "./shopping-view";

const recipes = new Map<string, Recipe>([
  [arrozBlanco.id, arrozBlanco],
  [huevosPericos.id, huevosPericos],
]);
const prices: PriceList = new Map([
  ["rice", { ingredientId: "rice", priceCop: 2800, per: { amount: 1, unit: "lb" } }],
  ["egg", { ingredientId: "egg", priceCop: 18000, per: { amount: 30, unit: "unit" } }],
  ["onion", { ingredientId: "onion", priceCop: 1000, per: { amount: 1, unit: "unit" } }],
]);

const build = (overrides: Partial<Parameters<typeof buildShoppingView>[0]> = {}) =>
  buildShoppingView({
    slots: [
      { day: 0, meal: "lunch", recipeId: "arroz-blanco", peopleOverride: null },
      { day: 0, meal: "breakfast", recipeId: "huevos-pericos", peopleOverride: null },
    ],
    recipes,
    people: 4,
    pantry: [],
    purchases: [],
    extras: [],
    catalog,
    prices,
    ...overrides,
  });

describe("buildShoppingView", () => {
  it("agrupa por categoría en orden de recorrido y totaliza", () => {
    const view = build();
    expect(view.groups.map((group) => group.label)).toEqual([
      "Verduras",
      "Lácteos y huevos",
      "Granos",
      "Despensa",
    ]);
    expect(view.totals.total).toBe(5);
    expect(view.totals.done).toBe(0);
    expect(view.totals.unpricedCount).toBe(2);
    expect(view.totals.pendingCop).toBe(view.totals.marketCop);
  });

  it("lo comprado baja lo pendiente pero no el total", () => {
    const before = build();
    const after = build({ purchases: [{ ingredientId: "rice", quantity: { amount: 500, unit: "g" } }] });
    expect(after.totals.marketCop).toBe(before.totals.marketCop);
    expect(before.totals.pendingCop - after.totals.pendingCop).toBe(2800);
    expect(after.totals.done).toBe(1);
  });

  it("separa lo que cubre la despensa", () => {
    const view = build({ pantry: [{ ingredientId: "rice", quantity: { amount: 2, unit: "kg" } }] });
    expect(view.inPantry.map((item) => item.ingredientId)).toEqual(["rice"]);
    expect(view.groups.find((group) => group.category === "grains")).toBeUndefined();
  });

  it("incluye extras en su categoría y en el progreso", () => {
    const view = build({
      extras: [{ id: "x", name: "Detergente", category: "cleaning", checked: true }],
    });
    expect(view.groups.at(-1)).toMatchObject({ label: "Aseo", items: [], extras: [{ name: "Detergente" }] });
    expect(view.totals).toMatchObject({ done: 1, total: 6 });
  });

  it("sin comidas no hay nada que comprar", () => {
    expect(build({ slots: [] })).toMatchObject({ plannedMeals: 0, groups: [], totals: { total: 0 } });
  });
});
