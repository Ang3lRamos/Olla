import { describe, expect, it } from "vitest";
import { buildShoppingLines, groupByCategory } from "./shopping-list";
import { arrozBlanco, catalog, huevosPericos, sudadoDePollo } from "./test-fixtures";
import type { PlannedMeal } from "./types";

const week: PlannedMeal[] = [
  { day: 0, recipe: arrozBlanco, servings: 4 },
  { day: 0, recipe: sudadoDePollo, servings: 4 },
  { day: 1, recipe: huevosPericos, servings: 2 },
];

describe("buildShoppingLines", () => {
  it("consolida ingredientes repetidos entre recetas", () => {
    const lines = buildShoppingLines(week, [], catalog);
    const byId = Object.fromEntries(lines.map((line) => [line.ingredientId, line]));

    expect(byId.onion?.toBuy).toEqual({ amount: 2, unit: "unit" });
    expect(byId.tomato?.toBuy).toEqual({ amount: 460, unit: "g" });
    expect(byId.oil?.toBuy).toEqual({ amount: 75, unit: "ml" });
    expect(lines).toHaveLength(6);
  });

  it("escala según las personas de cada comida", () => {
    const lines = buildShoppingLines([{ day: 0, recipe: arrozBlanco, servings: 6 }], [], catalog);
    expect(lines.find((line) => line.ingredientId === "rice")?.toBuy).toEqual({ amount: 750, unit: "g" });
  });

  it("redondea hacia arriba lo que se compra pero conserva lo necesario exacto", () => {
    const lines = buildShoppingLines([{ day: 0, recipe: arrozBlanco, servings: 3 }], [], catalog);
    const onion = lines.find((line) => line.ingredientId === "onion");
    expect(onion?.needed).toEqual({ amount: 0.375, unit: "unit" });
    expect(onion?.toBuy).toEqual({ amount: 1, unit: "unit" });
  });

  it("resta la despensa y reporta lo que cubre", () => {
    const lines = buildShoppingLines(
      week,
      [{ ingredientId: "rice", quantity: { amount: 1, unit: "kg" } }],
      catalog,
    );
    const rice = lines.find((line) => line.ingredientId === "rice");
    expect(rice).toMatchObject({ toBuy: { amount: 0, unit: "g" }, fromPantry: 500 });
  });

  it("devuelve una lista vacía para una semana sin comidas", () => {
    expect(buildShoppingLines([], [], catalog)).toEqual([]);
  });
});

describe("groupByCategory", () => {
  it("agrupa en el orden de recorrido y ordena por nombre dentro de cada grupo", () => {
    const groups = groupByCategory(buildShoppingLines(week, [], catalog));
    expect(groups.map((group) => group.label)).toEqual([
      "Verduras",
      "Proteínas",
      "Lácteos y huevos",
      "Granos",
      "Despensa",
    ]);
    expect(groups[0]?.lines.map((line) => line.name)).toEqual(["Cebolla cabezona", "Tomate"]);
  });

  it("omite categorías vacías", () => {
    expect(groupByCategory([])).toEqual([]);
  });
});
