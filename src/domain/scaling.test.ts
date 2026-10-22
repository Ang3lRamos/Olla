import { describe, expect, it } from "vitest";
import { scaleFactor, scaleRecipe } from "./scaling";
import { arrozBlanco } from "./test-fixtures";

describe("scaleFactor", () => {
  it("calcula la proporción entre porciones", () => {
    expect(scaleFactor(4, 6)).toBe(1.5);
    expect(scaleFactor(4, 1)).toBe(0.25);
  });

  it.each([
    [0, 4],
    [4, 0],
    [-2, 4],
    [4, Number.NaN],
  ])("rechaza porciones inválidas (%d -> %d)", (base, target) => {
    expect(() => scaleFactor(base, target)).toThrow(RangeError);
  });
});

describe("scaleRecipe", () => {
  it("multiplica cada ingrediente conservando su unidad", () => {
    expect(scaleRecipe(arrozBlanco, 6)).toEqual([
      { ingredientId: "rice", quantity: { amount: 1.5, unit: "lb" } },
      { ingredientId: "oil", quantity: { amount: 3, unit: "tbsp" } },
      { ingredientId: "onion", quantity: { amount: 0.75, unit: "unit" } },
    ]);
  });

  it("devuelve las mismas cantidades si las porciones no cambian", () => {
    expect(scaleRecipe(arrozBlanco, 4)).toEqual(arrozBlanco.ingredients);
  });

  it("no modifica la receta original", () => {
    scaleRecipe(arrozBlanco, 8);
    expect(arrozBlanco.ingredients[0]?.quantity.amount).toBe(1);
  });
});
