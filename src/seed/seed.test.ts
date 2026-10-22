import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/domain/catalog";
import { recipeCost, type PriceList } from "@/domain/costs";
import type { Recipe } from "@/domain/types";
import { SEED_INGREDIENTS, SEED_RECIPES, type SeedIngredientKey } from ".";

const keys = Object.keys(SEED_INGREDIENTS) as SeedIngredientKey[];

const catalog = buildCatalog(keys.map((key) => ({ id: key, ...SEED_INGREDIENTS[key], price: undefined })));
const prices: PriceList = new Map(
  keys.map((key) => [
    key,
    { ingredientId: key, priceCop: SEED_INGREDIENTS[key].price.cop, per: SEED_INGREDIENTS[key].price.per },
  ]),
);

const toRecipe = (seed: (typeof SEED_RECIPES)[number]): Recipe => ({
  id: seed.name,
  name: seed.name,
  baseServings: seed.baseServings,
  ingredients: seed.ingredients.map((entry) => ({
    ingredientId: entry.key,
    quantity: { amount: entry.amount, unit: entry.unit },
  })),
});

describe("semilla", () => {
  it("trae unas 30 recetas con nombres únicos", () => {
    expect(SEED_RECIPES).toHaveLength(30);
    expect(new Set(SEED_RECIPES.map((recipe) => recipe.name)).size).toBe(SEED_RECIPES.length);
  });

  it("tiene nombres de ingredientes únicos", () => {
    const names = keys.map((key) => SEED_INGREDIENTS[key].name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(SEED_RECIPES.map((recipe) => [recipe.name, recipe] as const))(
    "%s se puede costear completa con los precios de referencia",
    (_, seed) => {
      const estimate = recipeCost(toRecipe(seed), seed.baseServings, catalog, prices);
      expect(estimate.unpricedIngredientIds).toEqual([]);
      expect(estimate.totalCop).toBeGreaterThan(0);
    },
  );

  it("cada receta tiene pasos y no repite ingredientes", () => {
    for (const recipe of SEED_RECIPES) {
      expect(recipe.steps.length, recipe.name).toBeGreaterThan(0);
      const used = recipe.ingredients.map((entry) => entry.key);
      expect(new Set(used).size, recipe.name).toBe(used.length);
    }
  });
});
