import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/domain/catalog";
import type { Ingredient } from "@/domain/types";
import type { PlannedSlot } from "@/domain/week-plan";
import type { RecipeDetail } from "@/features/recipes/types";
import { matchRecipes, planWithMatches, preselectMatches, unusedPurchases } from "./cook-with";

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
const byId = new Map(recipes.map((item) => [item.id, item]));

const match = (chosen: string[]) => matchRecipes({ recipes, catalog, chosen: new Set(chosen), exclude: [] });

const plan = (
  chosen: string[],
  pantry: { ingredientId: string; grams: number }[],
  slots: PlannedSlot[] = [],
) =>
  planWithMatches({
    picked: match(chosen),
    slots,
    recipes: byId,
    catalog,
    weekPeople: 4,
    pantry: pantry.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: { amount: item.grams, unit: "g" },
    })),
  });

describe("matchRecipes", () => {
  it("ordena por lo que aprovecha y no cuenta los condimentos", () => {
    expect(match(["pollo", "papa"]).map((item) => [item.name, item.uses.length, item.missing])).toEqual([
      ["Sudado", 2, []],
      ["Ajiaco", 2, ["Mazorca"]],
      ["Costillas", 1, ["Costilla de cerdo"]],
    ]);
  });

  it("no ofrece lo que el hogar no quiere", () => {
    const matches = matchRecipes({ recipes, catalog, chosen: new Set(["papa"]), exclude: ["cerdo"] });
    expect(matches.map((item) => item.name)).not.toContain("Costillas");
  });

  it("entre las que aprovechan igual, primero las que encajan en el estilo", () => {
    const matches = matchRecipes({
      recipes,
      catalog,
      chosen: new Set(["papa"]),
      exclude: [],
      score: (item) => (item.id === "Sudado" ? 1 : 0),
    });
    expect(matches.slice(0, 2).map((item) => item.name)).toEqual(["Sudado", "Costillas"]);
  });

  it("marca de entrada solo las que piden una cosa aparte como mucho", () => {
    expect(preselectMatches(match(["papa"]), 8).map((item) => item.name)).toEqual(["Costillas", "Sudado"]);
  });
});

describe("planWithMatches", () => {
  it("llena solo las vacías, cada receta en su comida y sin repetir más de dos veces", () => {
    const { changes } = planWithMatches({
      picked: match(["pollo", "papa", "huevo"]),
      slots: [{ day: 0, meal: "lunch", recipeId: "Sudado", peopleOverride: null }],
      recipes: byId,
      catalog,
      weekPeople: 4,
      pantry: [],
    });
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

  it("no gasta más de lo que hay en casa y dice qué se acabó", () => {
    // 250 g de pollo alcanzan para dos recetas de 100 g para 4 personas.
    const { changes, ranOut } = plan(["pollo", "papa"], [{ ingredientId: "pollo", grams: 250 }]);
    const withChicken = changes.filter(
      (change) => change.recipeId === "Sudado" || change.recipeId === "Ajiaco",
    );
    expect(withChicken).toHaveLength(2);
    expect(ranOut).toEqual(["Pechuga de pollo"]);
  });

  it("cuenta lo que ya piden las comidas planeadas sin cocinar", () => {
    const { changes } = plan(
      ["pollo", "papa"],
      [{ ingredientId: "pollo", grams: 150 }],
      [{ day: 0, meal: "lunch", recipeId: "Sudado", peopleOverride: null }],
    );
    expect(changes.filter((change) => change.recipeId !== "Costillas")).toEqual([]);
  });

  it("lo que no está en la despensa no tiene tope y avisa qué hay que comprar", () => {
    const { changes, ranOut } = plan(["papa"], []);
    expect(ranOut).toEqual([]);
    expect(changes.find((change) => change.recipeId === "Costillas")?.reason).toBe(
      "Usa Papa criolla · compra Costilla de cerdo",
    );
  });
});

describe("unusedPurchases", () => {
  it("devuelve lo que ninguna receta del menú usa", () => {
    const slots = [{ day: 0, meal: "lunch" as const, recipeId: "Sudado", peopleOverride: null }];
    expect(unusedPurchases(["papa", "mazorca"], slots, byId)).toEqual(["mazorca"]);
  });
});
