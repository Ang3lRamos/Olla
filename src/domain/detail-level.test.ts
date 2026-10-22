import { describe, expect, it } from "vitest";
import { exactBaseQuantity, isSeasoning, toKitchenQuantity } from "./detail-level";
import { chicken, egg, oil, onion, rice } from "./test-fixtures";
import type { Ingredient } from "./types";

const garlic: Ingredient = {
  id: "garlic",
  name: "Ajo",
  category: "vegetables",
  baseUnit: "g",
  gramsPerUnit: 5,
};
const cumin: Ingredient = {
  id: "cumin",
  name: "Comino molido",
  category: "spices",
  baseUnit: "g",
  gramsPerUnit: null,
};

describe("isSeasoning", () => {
  it("reconoce condimentos por categoría y los de siempre por nombre", () => {
    expect(isSeasoning(cumin)).toBe(true);
    expect(isSeasoning(garlic)).toBe(true);
    expect(isSeasoning({ ...oil, name: "Aceite vegetal" })).toBe(true);
    expect(isSeasoning(rice)).toBe(false);
  });
});

describe("toKitchenQuantity", () => {
  it("pasa a libras por cuartos desde media libra y redondea gramos de 25 en 25", () => {
    expect(toKitchenQuantity({ amount: 612, unit: "g" }, chicken)).toEqual({ amount: 1.25, unit: "lb" });
    expect(toKitchenQuantity({ amount: 1, unit: "kg" }, chicken)).toEqual({ amount: 2, unit: "lb" });
    expect(toKitchenQuantity({ amount: 130, unit: "g" }, rice)).toEqual({ amount: 125, unit: "g" });
  });

  it("usa tazas y cucharadas para líquidos", () => {
    expect(toKitchenQuantity({ amount: 500, unit: "ml" }, oil)).toEqual({ amount: 2, unit: "cup" });
    expect(toKitchenQuantity({ amount: 40, unit: "ml" }, oil)).toEqual({ amount: 2.5, unit: "tbsp" });
  });

  it("redondea unidades a media y nunca deja cero", () => {
    expect(toKitchenQuantity({ amount: 2.3, unit: "unit" }, egg)).toEqual({ amount: 2.5, unit: "unit" });
    expect(toKitchenQuantity({ amount: 0.1, unit: "unit" }, onion)).toEqual({ amount: 0.5, unit: "unit" });
  });
});

describe("exactBaseQuantity", () => {
  it("da los gramos de una medida de cocina, y nada si ya está en gramos o en unidades", () => {
    expect(exactBaseQuantity({ amount: 1.5, unit: "lb" }, rice)).toEqual({ amount: 750, unit: "g" });
    expect(exactBaseQuantity({ amount: 200, unit: "g" }, rice)).toBeNull();
    expect(exactBaseQuantity({ amount: 2, unit: "unit" }, egg)).toBeNull();
  });
});
