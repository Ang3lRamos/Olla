import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/domain/catalog";
import type { Ingredient } from "@/domain/types";
import type { RecipeDetail } from "@/features/recipes/types";
import { matchRecipes, planWithMatches } from "./cook-with";

const ingredient = (
  id: string,
  name: string,
  category: Ingredient["category"] = "vegetables",
): Ingredient => ({
  id,
  name,
  category,
  baseUnit: "g",
  gramsPerUnit: null,
  own: false,
});

const catalog = buildCatalog([
  ingredient("pollo", "Pechuga de pollo", "proteins"),
  ingredient("papa", "Papa criolla"),
  ingredient("mazorca", "Mazorca"),
  ingredient("huevo", "Huevo", "dairy"),
  ingredient("cerdo", "Costilla de cerdo", "proteins"),
  ingredient("sal", "Sal", "pantry"),
]);

const recipe = (id: string, category: RecipeDetail["category"], ingredientIds: string[]): RecipeDetail => ({
  id,
  name: id,
  category,
  baseServings: 4,
  prepMinutes: null,
  steps: [],
  isOwn: false,
  ingredients: ingredientIds.map((ingredientId) => ({
    ingredientId,
    quantity: { amount: 100, unit: "g" },
    note: null,
  })),
});

const recipes = [
  recipe("Ajiaco", "soup", ["pollo", "papa", "mazorca", "sal"]),
  recipe("Sudado", "main", ["pollo", "papa", "sal"]),
  recipe("Pericos", "breakfast", ["huevo", "sal"]),
  recipe("Costillas", "main", ["cerdo", "papa"]),
];

describe("matchRecipes", () => {
  it("ordena por lo que aprovecha y no cuenta los condimentos", () => {
    const matches = matchRecipes({ recipes, catalog, chosen: new Set(["pollo", "papa"]), exclude: [] });
    expect(matches.map((match) => [match.name, match.uses.length, match.missing])).toEqual([
      ["Sudado", 2, []],
      ["Ajiaco", 2, ["Mazorca"]],
      ["Costillas", 1, ["Costilla de cerdo"]],
    ]);
  });

  it("no ofrece lo que el hogar no quiere", () => {
    const matches = matchRecipes({ recipes, catalog, chosen: new Set(["papa"]), exclude: ["cerdo"] });
    expect(matches.map((match) => match.name)).not.toContain("Costillas");
  });
});

describe("planWithMatches", () => {
  it("llena solo las vacías, cada receta en su comida y sin repetir más de dos veces", () => {
    const picked = matchRecipes({
      recipes,
      catalog,
      chosen: new Set(["pollo", "papa", "huevo"]),
      exclude: [],
    });
    const changes = planWithMatches(picked, [
      { day: 0, meal: "lunch", recipeId: "Sudado", peopleOverride: null },
    ]);
    expect(changes.some((change) => change.day === 0 && change.meal === "lunch")).toBe(false);
    expect(
      changes
        .filter((change) => change.meal === "breakfast")
        .every((change) => change.recipeId === "Pericos"),
    ).toBe(true);
    const counts = new Map<string, number>();
    for (const change of changes) counts.set(change.recipeId!, (counts.get(change.recipeId!) ?? 0) + 1);
    // Sudado ya estaba una vez en la semana: solo puede sumar una más.
    expect(counts.get("Sudado")).toBe(1);
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
    expect(changes[0]?.reason).toMatch(/^Usa /);
  });
});
