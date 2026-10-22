import { describe, expect, it } from "vitest";
import { adjustStock, stockBeforePurchases, subtractPantry } from "./pantry";
import { catalog, egg, rice } from "./test-fixtures";

describe("subtractPantry", () => {
  it("resta lo que hay en casa sin dejar cantidades negativas", () => {
    const result = subtractPantry(
      [
        { ingredientId: "rice", quantity: { amount: 500, unit: "g" } },
        { ingredientId: "egg", quantity: { amount: 4, unit: "unit" } },
      ],
      [
        { ingredientId: "rice", quantity: { amount: 1, unit: "kg" } },
        { ingredientId: "egg", quantity: { amount: 2, unit: "unit" } },
      ],
      catalog,
    );
    expect(result).toEqual([
      { ingredientId: "rice", quantity: { amount: 0, unit: "g" }, fromPantry: 500 },
      { ingredientId: "egg", quantity: { amount: 2, unit: "unit" }, fromPantry: 2 },
    ]);
  });

  it("convierte la unidad de la despensa antes de restar", () => {
    const [onion] = subtractPantry(
      [{ ingredientId: "onion", quantity: { amount: 3, unit: "unit" } }],
      [{ ingredientId: "onion", quantity: { amount: 300, unit: "g" } }],
      catalog,
    );
    expect(onion).toEqual({ ingredientId: "onion", quantity: { amount: 1, unit: "unit" }, fromPantry: 2 });
  });

  it("no resta si las unidades no son compatibles", () => {
    const [rice] = subtractPantry(
      [{ ingredientId: "rice", quantity: { amount: 500, unit: "g" } }],
      [{ ingredientId: "rice", quantity: { amount: 2, unit: "unit" } }],
      catalog,
    );
    expect(rice).toEqual({ ingredientId: "rice", quantity: { amount: 500, unit: "g" }, fromPantry: 0 });
  });

  it("suma entradas repetidas de la despensa", () => {
    const [oil] = subtractPantry(
      [{ ingredientId: "oil", quantity: { amount: 500, unit: "ml" } }],
      [
        { ingredientId: "oil", quantity: { amount: 200, unit: "ml" } },
        { ingredientId: "oil", quantity: { amount: 1, unit: "cup" } },
      ],
      catalog,
    );
    expect(oil?.quantity.amount).toBe(60);
    expect(oil?.fromPantry).toBe(440);
  });

  it("descarta residuos de coma flotante", () => {
    const [oil] = subtractPantry(
      [{ ingredientId: "oil", quantity: { amount: 0.1 + 0.2, unit: "ml" } }],
      [{ ingredientId: "oil", quantity: { amount: 0.3, unit: "ml" } }],
      catalog,
    );
    expect(oil?.quantity.amount).toBe(0);
  });

  it("ignora cantidades negativas en la despensa", () => {
    const [egg] = subtractPantry(
      [{ ingredientId: "egg", quantity: { amount: 4, unit: "unit" } }],
      [{ ingredientId: "egg", quantity: { amount: -3, unit: "unit" } }],
      catalog,
    );
    expect(egg).toEqual({ ingredientId: "egg", quantity: { amount: 4, unit: "unit" }, fromPantry: 0 });
  });
});

describe("adjustStock", () => {
  it("suma compras y resta lo cocinado en la unidad base, sin bajar de cero", () => {
    expect(adjustStock({ amount: 1, unit: "lb" }, { amount: 200, unit: "g" }, rice)).toEqual({
      amount: 700,
      unit: "g",
    });
    expect(adjustStock({ amount: 300, unit: "g" }, { amount: -500, unit: "g" }, rice)).toEqual({
      amount: 0,
      unit: "g",
    });
    expect(adjustStock(undefined, { amount: 6, unit: "unit" }, egg)).toEqual({ amount: 6, unit: "unit" });
  });

  it("no mezcla unidades que no se pueden convertir", () => {
    expect(adjustStock({ amount: 6, unit: "unit" }, { amount: 100, unit: "g" }, egg)).toBeNull();
  });
});

describe("stockBeforePurchases", () => {
  it("quita de la despensa lo comprado en la semana para no contarlo dos veces", () => {
    const before = stockBeforePurchases(
      [{ ingredientId: "rice", quantity: { amount: 2, unit: "lb" } }],
      [{ ingredientId: "rice", quantity: { amount: 1500, unit: "g" } }],
      catalog,
    );
    expect(before).toEqual([{ ingredientId: "rice", quantity: { amount: 0, unit: "g" } }]);
  });
});
