import { describe, expect, it } from "vitest";
import { consolidate } from "./consolidation";
import { catalog } from "./test-fixtures";

describe("consolidate", () => {
  it("suma el mismo ingrediente expresado en unidades distintas pero convertibles", () => {
    const result = consolidate(
      [
        { ingredientId: "rice", quantity: { amount: 1, unit: "lb" } },
        { ingredientId: "rice", quantity: { amount: 250, unit: "g" } },
        { ingredientId: "rice", quantity: { amount: 0.25, unit: "kg" } },
      ],
      catalog,
    );
    expect(result).toEqual([{ ingredientId: "rice", quantity: { amount: 1000, unit: "g" } }]);
  });

  it("une unidades y gramos usando el peso por unidad", () => {
    const result = consolidate(
      [
        { ingredientId: "onion", quantity: { amount: 1, unit: "unit" } },
        { ingredientId: "onion", quantity: { amount: 75, unit: "g" } },
      ],
      catalog,
    );
    expect(result).toEqual([{ ingredientId: "onion", quantity: { amount: 1.5, unit: "unit" } }]);
  });

  it("separa cantidades que no se pueden convertir entre sí", () => {
    const result = consolidate(
      [
        { ingredientId: "egg", quantity: { amount: 2, unit: "unit" } },
        { ingredientId: "egg", quantity: { amount: 100, unit: "g" } },
      ],
      catalog,
    );
    expect(result).toEqual([
      { ingredientId: "egg", quantity: { amount: 2, unit: "unit" } },
      { ingredientId: "egg", quantity: { amount: 100, unit: "g" } },
    ]);
  });

  it("devuelve una lista vacía si no hay nada que consolidar", () => {
    expect(consolidate([], catalog)).toEqual([]);
  });

  it("no altera las cantidades de entrada", () => {
    const input = [
      { ingredientId: "oil", quantity: { amount: 10, unit: "ml" as const } },
      { ingredientId: "oil", quantity: { amount: 5, unit: "ml" as const } },
    ];
    consolidate(input, catalog);
    expect(input[0]?.quantity.amount).toBe(10);
  });

  it("falla con un mensaje claro si el ingrediente no existe", () => {
    expect(() =>
      consolidate([{ ingredientId: "nope", quantity: { amount: 1, unit: "g" } }], catalog),
    ).toThrow("Ingrediente desconocido: nope");
  });
});
