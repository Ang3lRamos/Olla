import { describe, expect, it } from "vitest";
import { buildCatalog } from "./catalog";
import { dailyNutritionPerPerson, nutrientsFromLabel, nutrientsOf, recipeNutrition } from "./nutrition";
import type { Ingredient, Recipe } from "./types";

const rice: Ingredient = {
  id: "rice",
  name: "Arroz",
  category: "grains",
  baseUnit: "g",
  gramsPerUnit: null,
  nutrients: { basis: "100g", kcal: 360, protein: 6.7, carbs: 79, sugar: 0.1, fat: 0.6, fiber: 1.3 },
};
const egg: Ingredient = {
  id: "egg",
  name: "Huevo",
  category: "dairy",
  baseUnit: "unit",
  gramsPerUnit: null,
  nutrients: { basis: "unit", kcal: 72, protein: 6.3, carbs: 0.4, sugar: 0.2, fat: 4.8, fiber: 0 },
};
const milk: Ingredient = {
  id: "milk",
  name: "Leche",
  category: "dairy",
  baseUnit: "ml",
  gramsPerUnit: null,
  nutrients: { basis: "100ml", kcal: 61, protein: 3.2, carbs: 4.8, sugar: 5, fat: 3.3, fiber: 0 },
};
const onion: Ingredient = {
  id: "onion",
  name: "Cebolla cabezona",
  category: "vegetables",
  baseUnit: "unit",
  gramsPerUnit: 150,
  nutrients: { basis: "100g", kcal: 40, protein: 1.1, carbs: 9.3, sugar: 4.2, fat: 0.1, fiber: 1.7 },
};
const mystery: Ingredient = {
  id: "x",
  name: "Hogao casero",
  category: "pantry",
  baseUnit: "g",
  gramsPerUnit: null,
};
const catalog = buildCatalog([rice, egg, milk, onion, mystery]);

describe("nutrientsOf", () => {
  it("escala por 100 g, por 100 ml y por unidad", () => {
    expect(nutrientsOf({ amount: 1, unit: "lb" }, rice)?.kcal).toBeCloseTo(1800);
    expect(nutrientsOf({ amount: 2, unit: "unit" }, egg)?.protein).toBeCloseTo(12.6);
    expect(nutrientsOf({ amount: 1, unit: "cup" }, milk)?.kcal).toBeCloseTo(146.4);
  });

  it("convierte unidades a gramos solo si se sabe cuánto pesa una", () => {
    expect(nutrientsOf({ amount: 1, unit: "unit" }, onion)?.kcal).toBeCloseTo(60);
    expect(nutrientsOf({ amount: 100, unit: "g" }, egg)).toBeNull();
    expect(nutrientsOf({ amount: 100, unit: "g" }, mystery)).toBeNull();
  });
});

const omelette: Recipe = {
  id: "r",
  name: "Arroz con huevo",
  baseServings: 2,
  ingredients: [
    { ingredientId: "rice", quantity: { amount: 200, unit: "g" } },
    { ingredientId: "egg", quantity: { amount: 4, unit: "unit" } },
    { ingredientId: "x", quantity: { amount: 50, unit: "g" } },
  ],
};

describe("recipeNutrition", () => {
  it("suma la receta, la divide por porción y dice qué faltó", () => {
    const result = recipeNutrition(omelette, 2, catalog);
    expect(result.totals.kcal).toBeCloseTo(720 + 288);
    expect(result.perServing.protein).toBeCloseTo((13.4 + 25.2) / 2);
    expect(result.missing).toEqual(["Hogao casero"]);
  });
});

describe("dailyNutritionPerPerson", () => {
  it("da lo de una persona por día, aunque cambien las personas de cada comida", () => {
    const days = dailyNutritionPerPerson(
      [
        { day: 0, recipe: omelette, servings: 2 },
        { day: 0, recipe: omelette, servings: 6 },
      ],
      catalog,
    );
    // Cada comida aporta lo mismo por persona: (720 + 288) / 2 kcal.
    expect(days[0]!.totals.kcal).toBeCloseTo(1008);
    expect(days[1]!.totals.kcal).toBe(0);
  });
});

describe("nutrientsFromLabel", () => {
  const empty = { kcal: null, protein: null, carbs: null, sugar: null, fat: null, fiber: null };

  it("toma la base de la unidad del producto y cuenta lo vacío como 0", () => {
    expect(nutrientsFromLabel({ ...empty, kcal: 380, protein: 13 }, "g")).toEqual({
      basis: "100g",
      kcal: 380,
      protein: 13,
      carbs: 0,
      sugar: 0,
      fat: 0,
      fiber: 0,
    });
    expect(nutrientsFromLabel({ ...empty, kcal: 45 }, "ml")?.basis).toBe("100ml");
    expect(nutrientsFromLabel({ ...empty, kcal: 90 }, "unit")?.basis).toBe("unit");
  });

  it("sin ningún valor no guarda datos", () => {
    expect(nutrientsFromLabel(empty, "g")).toBeNull();
  });
});
