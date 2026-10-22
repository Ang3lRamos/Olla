import { describe, expect, it } from "vitest";
import { formatKitchenNumber, formatRecipeQuantity } from "./kitchen-format";

describe("formatKitchenNumber", () => {
  it.each([
    [2, "2"],
    [0.5, "½"],
    [1.5, "1 ½"],
    [0.25, "¼"],
    [0.75, "¾"],
    [1 / 3, "⅓"],
    [2 / 3, "⅔"],
    [0.375, "0,4"],
    [2.98, "3"],
    [0.6, "0,6"],
  ])("%d -> %s", (amount, expected) => {
    expect(formatKitchenNumber(amount)).toBe(expected);
  });
});

describe("formatRecipeQuantity", () => {
  it("usa fracciones y singular o plural en unidades de cocina", () => {
    expect(formatRecipeQuantity({ amount: 0.5, unit: "cup" })).toBe("½ taza");
    expect(formatRecipeQuantity({ amount: 1, unit: "lb" })).toBe("1 libra");
    expect(formatRecipeQuantity({ amount: 1.5, unit: "lb" })).toBe("1 ½ libras");
    expect(formatRecipeQuantity({ amount: 3, unit: "tbsp" })).toBe("3 cucharadas");
    expect(formatRecipeQuantity({ amount: 0.25, unit: "unit" })).toBe("¼ unidad");
  });

  it("usa decimales en unidades métricas", () => {
    expect(formatRecipeQuantity({ amount: 37.5, unit: "g" })).toBe("37,5 g");
    expect(formatRecipeQuantity({ amount: 1.25, unit: "kg" })).toBe("1,25 kg");
    expect(formatRecipeQuantity({ amount: 250, unit: "ml" })).toBe("250 ml");
  });
});
