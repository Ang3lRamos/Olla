import { describe, expect, it } from "vitest";
import { buildCatalog } from "./catalog";
import type { PriceList } from "./costs";
import { styleLevels, styleScore } from "./menu-styles";
import {
  arrozBlanco,
  catalog,
  chicken,
  egg,
  huevosPericos,
  oil,
  onion,
  rice,
  sudadoDePollo,
  tomato,
} from "./test-fixtures";

const prices: PriceList = new Map([
  ["rice", { ingredientId: "rice", priceCop: 2800, per: { amount: 1, unit: "lb" } }],
  ["chicken", { ingredientId: "chicken", priceCop: 14000, per: { amount: 1, unit: "kg" } }],
]);

const withNutrients = buildCatalog([
  {
    ...rice,
    nutrients: { basis: "100g", kcal: 360, protein: 6.7, carbs: 79, sugar: 0, fat: 0.6, fiber: 1.3 },
  },
  {
    ...chicken,
    nutrients: { basis: "100g", kcal: 120, protein: 23, carbs: 0, sugar: 0, fat: 2.6, fiber: 0 },
  },
  { ...oil, nutrients: { basis: "100ml", kcal: 884, protein: 0, carbs: 0, sugar: 0, fat: 100, fiber: 0 } },
  {
    ...onion,
    nutrients: { basis: "100g", kcal: 40, protein: 1.1, carbs: 9.3, sugar: 4.2, fat: 0.1, fiber: 1.7 },
  },
  {
    ...tomato,
    nutrients: { basis: "100g", kcal: 18, protein: 0.9, carbs: 3.9, sugar: 2.6, fat: 0.2, fiber: 1.2 },
  },
  egg,
]);

describe("styleScore", () => {
  it("más verduras: gramos de verdura por porción, también lo que se cuenta por unidades", () => {
    // Sudado: 3 tomates de 120 g y una cebolla de 150 g para 4.
    expect(styleScore("vegetables", sudadoDePollo, catalog, prices)).toBeCloseTo(127.5);
    expect(styleScore("vegetables", huevosPericos, catalog, prices)).toBeCloseTo(87.5);
  });

  it("más proteína: gramos estimados por porción", () => {
    const sudado = styleScore("protein", sudadoDePollo, withNutrients, prices);
    const arroz = styleScore("protein", arrozBlanco, withNutrients, prices);
    expect(sudado).toBeGreaterThan(arroz);
    expect(sudado).toBeGreaterThan(57.5);
  });

  it("porciones ligeras: menos calorías puntúa más, y sin datos completos va de último", () => {
    expect(styleScore("light", sudadoDePollo, withNutrients, prices)).toBeGreaterThan(
      styleScore("light", arrozBlanco, withNutrients, prices),
    );
    expect(styleScore("light", huevosPericos, withNutrients, prices)).toBe(-Infinity);
  });

  it("rinde más: lo más barato por porción puntúa más", () => {
    expect(styleScore("budget", arrozBlanco, catalog, prices)).toBeGreaterThan(
      styleScore("budget", sudadoDePollo, catalog, prices),
    );
  });
});

describe("styleLevels", () => {
  it("reparte del 1 al 5 por posición y empata los iguales", () => {
    expect(styleLevels([10, 30, 20])).toEqual([1, 5, 3]);
    expect(styleLevels([-Infinity, 4, 4])).toEqual([1, 3, 3]);
    expect(styleLevels([7])).toEqual([5]);
  });
});
