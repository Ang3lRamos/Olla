import { getIngredient, type IngredientCatalog } from "@/domain/catalog";
import { isSeasoning } from "@/domain/detail-level";
import type { RecipeCategory } from "@/domain/recipe-categories";
import { MEALS, type Meal } from "@/domain/week";
import type { PlannedSlot } from "@/domain/week-plan";
import { PREFERRED_CATEGORIES } from "@/features/assistant/pick-recipe";
import type { ProposedChange } from "@/features/assistant/sanitize";
import { normalizeForSearch } from "@/features/recipes/search";
import type { RecipeDetail } from "@/features/recipes/types";

/** Una receta frente a lo que la persona tiene: qué aprovecha y qué le faltaría comprar. */
export interface RecipeMatch {
  recipeId: string;
  name: string;
  category: RecipeCategory;
  uses: string[];
  missing: string[];
}

const MAX_REPEATS = 2;

interface MatchInput {
  recipes: RecipeDetail[];
  catalog: IngredientCatalog;
  /** Ingredientes que la persona compró o tiene. */
  chosen: Set<string>;
  /** "No incluir" del hogar: esas recetas no se ofrecen. */
  exclude: string[];
}

/**
 * Las recetas que usan algo de lo elegido, primero las que más aprovechan y menos piden aparte.
 * Los condimentos (sal, ajo, aceite…) no cuentan ni a favor ni en contra: casi siempre hay.
 */
export function matchRecipes({ recipes, catalog, chosen, exclude }: MatchInput): RecipeMatch[] {
  const banned = exclude.map(normalizeForSearch).filter(Boolean);
  return recipes
    .flatMap((recipe) => {
      const ingredients = recipe.ingredients.map((line) => ({
        id: line.ingredientId,
        ingredient: getIngredient(catalog, line.ingredientId),
      }));
      const text = normalizeForSearch(
        [recipe.name, ...ingredients.map((item) => item.ingredient.name)].join(" "),
      );
      if (banned.some((term) => text.includes(term))) return [];
      const main = ingredients.filter((item) => !isSeasoning(item.ingredient));
      const uses = main.filter((item) => chosen.has(item.id)).map((item) => item.ingredient.name);
      if (uses.length === 0) return [];
      const missing = main.filter((item) => !chosen.has(item.id)).map((item) => item.ingredient.name);
      return [{ recipeId: recipe.id, name: recipe.name, category: recipe.category, uses, missing }];
    })
    .sort(
      (a, b) =>
        b.uses.length - a.uses.length ||
        a.missing.length - b.missing.length ||
        a.name.localeCompare(b.name, "es"),
    );
}

const usesText = (uses: string[]) =>
  uses.length === 1 ? `Usa ${uses[0]}` : `Usa ${uses.slice(0, -1).join(", ")} y ${uses.at(-1)}`;

/**
 * Llena las casillas vacías con las recetas elegidas: cada una en la comida que le va (desayuno,
 * almuerzo, comida), sin repetir más de dos veces y alternando para que no salga lo mismo seguido.
 */
export function planWithMatches(picked: RecipeMatch[], slots: PlannedSlot[]): ProposedChange[] {
  const taken = new Set(slots.map((slot) => `${slot.day}-${slot.meal}`));
  const usage = new Map<string, number>();
  for (const slot of slots) usage.set(slot.recipeId, (usage.get(slot.recipeId) ?? 0) + 1);

  const fitsMeal = (meal: Meal, match: RecipeMatch) => PREFERRED_CATEGORIES[meal].includes(match.category);
  const changes: ProposedChange[] = [];
  for (let day = 0; day < 7; day++) {
    for (const meal of MEALS) {
      if (taken.has(`${day}-${meal}`)) continue;
      const choice = picked
        .filter((match) => fitsMeal(meal, match) && (usage.get(match.recipeId) ?? 0) < MAX_REPEATS)
        .sort((a, b) => (usage.get(a.recipeId) ?? 0) - (usage.get(b.recipeId) ?? 0))[0];
      if (!choice) continue;
      usage.set(choice.recipeId, (usage.get(choice.recipeId) ?? 0) + 1);
      changes.push({ day, meal, recipeId: choice.recipeId, reason: usesText(choice.uses) });
    }
  }
  return changes;
}
