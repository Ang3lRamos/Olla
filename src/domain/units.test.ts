import { describe, expect, it } from "vitest";
import { egg, onion, rice, tomato } from "./test-fixtures";
import { formatQuantity, toBase, toIngredientBase } from "./units";

describe("toBase", () => {
  it.each([
    [
      { amount: 1.5, unit: "kg" },
      { amount: 1500, unit: "g" },
    ],
    [
      { amount: 2, unit: "lb" },
      { amount: 1000, unit: "g" },
    ],
    [
      { amount: 1, unit: "l" },
      { amount: 1000, unit: "ml" },
    ],
    [
      { amount: 1, unit: "cup" },
      { amount: 240, unit: "ml" },
    ],
    [
      { amount: 2, unit: "tbsp" },
      { amount: 30, unit: "ml" },
    ],
    [
      { amount: 1, unit: "tsp" },
      { amount: 5, unit: "ml" },
    ],
    [
      { amount: 3, unit: "unit" },
      { amount: 3, unit: "unit" },
    ],
  ] as const)("convierte %o a %o", (quantity, expected) => {
    expect(toBase(quantity)).toEqual(expected);
  });

  it("conserva el cero", () => {
    expect(toBase({ amount: 0, unit: "kg" })).toEqual({ amount: 0, unit: "g" });
  });
});

describe("toIngredientBase", () => {
  it("pasa unidades a gramos cuando el ingrediente tiene peso por unidad", () => {
    expect(toIngredientBase({ amount: 3, unit: "unit" }, tomato)).toEqual({ amount: 360, unit: "g" });
  });

  it("pasa gramos a unidades cuando la unidad base es contable", () => {
    expect(toIngredientBase({ amount: 300, unit: "g" }, onion)).toEqual({ amount: 2, unit: "unit" });
  });

  it("no inventa conversiones si falta el peso por unidad", () => {
    expect(toIngredientBase({ amount: 2, unit: "unit" }, rice)).toEqual({ amount: 2, unit: "unit" });
    expect(toIngredientBase({ amount: 100, unit: "g" }, egg)).toEqual({ amount: 100, unit: "g" });
  });

  it("no mezcla volumen con masa", () => {
    expect(toIngredientBase({ amount: 1, unit: "cup" }, rice)).toEqual({ amount: 240, unit: "ml" });
  });
});

describe("formatQuantity", () => {
  it("usa kg y l desde 1000", () => {
    expect(formatQuantity({ amount: 1500, unit: "g" })).toBe("1,5 kg");
    expect(formatQuantity({ amount: 2000, unit: "ml" })).toBe("2 l");
  });

  it("deja gramos y mililitros por debajo de 1000", () => {
    expect(formatQuantity({ amount: 250, unit: "g" })).toBe("250 g");
    expect(formatQuantity({ amount: 999, unit: "ml" })).toBe("999 ml");
  });

  it("usa singular y plural en unidades", () => {
    expect(formatQuantity({ amount: 1, unit: "unit" })).toBe("1 unidad");
    expect(formatQuantity({ amount: 3, unit: "unit" })).toBe("3 unidades");
    expect(formatQuantity({ amount: 0.5, unit: "unit" })).toBe("0,5 unidades");
  });

  it("limita los decimales", () => {
    expect(formatQuantity({ amount: 1 / 3, unit: "g" })).toBe("0,33 g");
  });
});
