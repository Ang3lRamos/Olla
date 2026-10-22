import { describe, expect, it } from "vitest";
import { buildPriceList, dailyCosts, estimateCost, quantityCost, recipeCost, type PriceList } from "./costs";
import { formatCop } from "./money";
import { arrozBlanco, catalog, huevosPericos, onion, rice, tomato } from "./test-fixtures";
import type { IngredientPrice } from "./types";

const priceList = (prices: IngredientPrice[]): PriceList =>
  new Map(prices.map((price) => [price.ingredientId, price]));

const prices = priceList([
  { ingredientId: "rice", priceCop: 2800, per: { amount: 1, unit: "lb" } },
  { ingredientId: "oil", priceCop: 12000, per: { amount: 1, unit: "l" } },
  { ingredientId: "onion", priceCop: 1000, per: { amount: 1, unit: "unit" } },
  { ingredientId: "egg", priceCop: 18000, per: { amount: 30, unit: "unit" } },
  { ingredientId: "tomato", priceCop: 4000, per: { amount: 1, unit: "kg" } },
]);

describe("quantityCost", () => {
  it("prorratea el precio según la cantidad", () => {
    expect(quantityCost({ amount: 250, unit: "g" }, rice, prices.get("rice"))).toBe(1400);
  });

  it("convierte entre unidades y gramos si el ingrediente lo permite", () => {
    const perKilo = { ingredientId: "onion", priceCop: 6000, per: { amount: 1, unit: "kg" } } as const;
    expect(quantityCost({ amount: 2, unit: "unit" }, onion, perKilo)).toBeCloseTo(1800);
    expect(quantityCost({ amount: 3, unit: "unit" }, tomato, prices.get("tomato"))).toBeCloseTo(1440);
  });

  it("devuelve null sin precio o con unidades incompatibles", () => {
    expect(quantityCost({ amount: 1, unit: "g" }, rice, undefined)).toBeNull();
    const perCup = { ingredientId: "rice", priceCop: 1000, per: { amount: 1, unit: "cup" } } as const;
    expect(quantityCost({ amount: 100, unit: "g" }, rice, perCup)).toBeNull();
  });

  it("devuelve null si el precio es por una cantidad cero", () => {
    const broken = { ingredientId: "rice", priceCop: 1000, per: { amount: 0, unit: "g" } } as const;
    expect(quantityCost({ amount: 100, unit: "g" }, rice, broken)).toBeNull();
  });
});

describe("estimateCost", () => {
  it("suma y redondea a pesos enteros", () => {
    const result = estimateCost(
      [
        { ingredientId: "rice", quantity: { amount: 333, unit: "g" } },
        { ingredientId: "oil", quantity: { amount: 30, unit: "ml" } },
      ],
      catalog,
      prices,
    );
    expect(result).toEqual({ totalCop: 2225, unpricedIngredientIds: [] });
  });

  it("reporta los ingredientes sin precio sin romper el total", () => {
    const result = estimateCost(
      [
        { ingredientId: "chicken", quantity: { amount: 1000, unit: "g" } },
        { ingredientId: "onion", quantity: { amount: 1, unit: "unit" } },
      ],
      catalog,
      prices,
    );
    expect(result).toEqual({ totalCop: 1000, unpricedIngredientIds: ["chicken"] });
  });

  it("no exige precio para cantidades en cero", () => {
    const result = estimateCost(
      [{ ingredientId: "chicken", quantity: { amount: 0, unit: "g" } }],
      catalog,
      prices,
    );
    expect(result).toEqual({ totalCop: 0, unpricedIngredientIds: [] });
  });
});

describe("recipeCost", () => {
  it("calcula el costo escalado a las porciones", () => {
    expect(recipeCost(arrozBlanco, 4, catalog, prices).totalCop).toBe(3660);
    expect(recipeCost(arrozBlanco, 8, catalog, prices).totalCop).toBe(7320);
  });
});

describe("dailyCosts", () => {
  it("devuelve los 7 días, con cero en los días sin comidas", () => {
    const days = dailyCosts(
      [
        { day: 0, recipe: arrozBlanco, servings: 4 },
        { day: 0, recipe: huevosPericos, servings: 2 },
        { day: 3, recipe: arrozBlanco, servings: 2 },
      ],
      catalog,
      prices,
    );
    expect(days).toHaveLength(7);
    expect(days.map((day) => day.totalCop)).toEqual([3660 + 3300, 0, 0, 1830, 0, 0, 0]);
  });
});

describe("formatCop", () => {
  it("formatea pesos colombianos sin decimales", () => {
    expect(formatCop(12500.4).replace(/\s/g, " ")).toBe("$ 12.500");
  });
});

describe("buildPriceList", () => {
  const per = { amount: 1, unit: "kg" } as const;

  it("prefiere el precio del hogar sobre el de referencia, sin importar el orden", () => {
    const prices = buildPriceList([
      { ingredientId: "rice", priceCop: 3500, per, householdId: "casa" },
      { ingredientId: "rice", priceCop: 6000, per, householdId: null },
      { ingredientId: "oil", priceCop: 12000, per: { amount: 1, unit: "l" }, householdId: null },
    ]);
    expect(prices.get("rice")).toEqual({ ingredientId: "rice", priceCop: 3500, per });
    expect(prices.get("oil")?.priceCop).toBe(12000);
  });
});
