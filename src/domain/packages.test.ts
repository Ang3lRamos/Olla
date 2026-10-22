import { describe, expect, it } from "vitest";
import { estimatePurchases, formatPackages, formatPieces, piecesIn, planPurchase } from "./packages";
import { catalog, egg, rice } from "./test-fixtures";
import type { Ingredient, IngredientPrice } from "./types";

const slicedCheese: Ingredient = {
  id: "cheese",
  name: "Queso tajado",
  category: "dairy",
  baseUnit: "g",
  gramsPerUnit: null,
};
const cheesePack: IngredientPrice = {
  ingredientId: "cheese",
  priceCop: 9800,
  per: { amount: 450, unit: "g" },
  own: true,
  packageLabel: "paquete",
  pieces: { count: 18, label: "tajadas" },
};

describe("planPurchase", () => {
  it("con el precio propio compra paquetes enteros y cobra cada uno completo", () => {
    expect(planPurchase({ amount: 150, unit: "g" }, slicedCheese, cheesePack)).toEqual({
      packages: 1,
      quantity: { amount: 450, unit: "g" },
      costCop: 9800,
    });
    expect(planPurchase({ amount: 451, unit: "g" }, slicedCheese, cheesePack).packages).toBe(2);
  });

  it("no compra un paquete de más por errores de redondeo", () => {
    expect(planPurchase({ amount: 900.0000001, unit: "g" }, slicedCheese, cheesePack).packages).toBe(2);
  });

  it("con el precio de referencia estima lo justo, sin paquetes", () => {
    const reference = { ...cheesePack, own: false };
    expect(planPurchase({ amount: 150, unit: "g" }, slicedCheese, reference)).toEqual({
      packages: null,
      quantity: { amount: 150, unit: "g" },
      costCop: (150 / 450) * 9800,
    });
  });

  it("sin precio no inventa costo, y nada que comprar cuesta cero", () => {
    expect(planPurchase({ amount: 2, unit: "unit" }, egg, undefined).costCop).toBeNull();
    expect(planPurchase({ amount: 0, unit: "g" }, slicedCheese, cheesePack)).toMatchObject({ costCop: 0 });
  });

  it("acepta presentaciones en otra unidad compatible (libras)", () => {
    const bag: IngredientPrice = {
      ingredientId: "rice",
      priceCop: 2800,
      per: { amount: 1, unit: "lb" },
      own: true,
    };
    expect(planPurchase({ amount: 700, unit: "g" }, rice, bag)).toMatchObject({ packages: 2, costCop: 5600 });
  });
});

describe("porciones", () => {
  it("cuenta las tajadas de una cantidad en gramos", () => {
    expect(piecesIn({ amount: 150, unit: "g" }, slicedCheese, cheesePack)).toBeCloseTo(6);
    expect(piecesIn({ amount: 150, unit: "g" }, slicedCheese, { ...cheesePack, pieces: null })).toBeNull();
  });

  it("redondea a media porción y avisa que es aproximado", () => {
    expect(formatPieces(6, "tajadas")).toBe("6 tajadas");
    expect(formatPieces(6.3, "tajadas")).toBe("≈ 6,5 tajadas");
  });

  it("nombra los paquetes en singular y plural", () => {
    expect(formatPackages(1, cheesePack)).toBe("1 paquete");
    expect(formatPackages(2, { ...cheesePack, packageLabel: "unidad" })).toBe("2 unidades");
    expect(formatPackages(3, { ...cheesePack, packageLabel: null })).toBe("3 paquetes");
  });
});

describe("estimatePurchases", () => {
  it("suma el mercado en paquetes y marca lo que no tiene precio", () => {
    const prices = new Map([
      ["rice", { ingredientId: "rice", priceCop: 2800, per: { amount: 1, unit: "lb" } as const, own: true }],
    ]);
    expect(
      estimatePurchases(
        [
          { ingredientId: "rice", quantity: { amount: 700, unit: "g" } },
          { ingredientId: "egg", quantity: { amount: 4, unit: "unit" } },
        ],
        catalog,
        prices,
      ),
    ).toEqual({ totalCop: 5600, unpricedIngredientIds: ["egg"] });
  });
});
