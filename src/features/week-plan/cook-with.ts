import { getIngredient, type IngredientCatalog } from "@/domain/catalog";
import { isSeasoning } from "@/domain/detail-level";
import type { RecipeCategory } from "@/domain/recipe-categories";
import { shortages, stockAfter, withdraw } from "@/domain/stock";
import type { PantryItem, Recipe } from "@/domain/types";
import { MEALS, type Meal } from "@/domain/week";
import { toPlannedMeals, type PlannedSlot } from "@/domain/week-plan";
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
  /** Ingredientes que la persona tiene o va a mercar. */
  chosen: Set<string>;
  /** "No incluir" del hogar: esas recetas no se ofrecen. */
  exclude: string[];
  /** Cuánto encaja cada receta en el estilo elegido; desempata entre las que aprovechan igual. */
  score?: (recipe: RecipeDetail) => number;
}

/**
 * Las recetas que usan algo de lo elegido, primero las que más aprovechan y menos piden aparte.
 * Los condimentos (sal, ajo, aceite…) no cuentan ni a favor ni en contra: casi siempre hay.
 */
export function matchRecipes({ recipes, catalog, chosen, exclude, score }: MatchInput): RecipeMatch[] {
  const banned = exclude.map(normalizeForSearch).filter(Boolean);
  const scores = new Map(recipes.map((recipe) => [recipe.id, score?.(recipe) ?? 0]));
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
        scores.get(b.recipeId)! - scores.get(a.recipeId)! ||
        a.name.localeCompare(b.name, "es"),
    );
}

/** Las que vienen marcadas: las que no piden nada aparte o casi nada. */
export const preselectMatches = (matches: RecipeMatch[], limit: number) =>
  matches.filter((match) => match.missing.length <= 1).slice(0, limit);

const listText = (names: string[]) =>
  names.length === 1 ? names[0]! : `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;

const reasonFor = (match: RecipeMatch) =>
  match.missing.length === 0
    ? `Usa ${listText(match.uses)}`
    : `Usa ${listText(match.uses)} · compra ${listText(match.missing)}`;

interface PlanInput {
  picked: RecipeMatch[];
  slots: PlannedSlot[];
  recipes: ReadonlyMap<string, Recipe>;
  catalog: IngredientCatalog;
  weekPeople: number;
  /** Lo que la persona tiene en casa y eligió usar; lo que va a mercar no tiene tope. */
  pantry: PantryItem[];
}

export interface StockPlan {
  changes: ProposedChange[];
  /** Lo de casa que se acabó y dejó alguna receta por fuera. */
  ranOut: string[];
}

/**
 * Llena las casillas vacías con las recetas elegidas: cada una en la comida que le va (desayuno,
 * almuerzo, comida), sin repetir más de dos veces, alternando y sin gastar más de lo que hay en
 * casa, contando lo que ya piden las comidas planeadas sin cocinar.
 */
export function planWithMatches({
  picked,
  slots,
  recipes,
  catalog,
  weekPeople,
  pantry,
}: PlanInput): StockPlan {
  const taken = new Set(slots.map((slot) => `${slot.day}-${slot.meal}`));
  const usage = new Map<string, number>();
  for (const slot of slots) usage.set(slot.recipeId, (usage.get(slot.recipeId) ?? 0) + 1);
  const pending = toPlannedMeals(
    slots.filter((slot) => !slot.cooked),
    recipes,
    weekPeople,
  );
  let stock = stockAfter(pantry, pending, catalog);
  const counts = (id: string) => !isSeasoning(getIngredient(catalog, id));
  const ranOut = new Set<string>();

  const fitsMeal = (meal: Meal, match: RecipeMatch) => PREFERRED_CATEGORIES[meal].includes(match.category);
  const changes: ProposedChange[] = [];
  for (let day = 0; day < 7; day++) {
    for (const meal of MEALS) {
      if (taken.has(`${day}-${meal}`)) continue;
      const candidates = picked
        .filter((match) => fitsMeal(meal, match) && (usage.get(match.recipeId) ?? 0) < MAX_REPEATS)
        .sort((a, b) => (usage.get(a.recipeId) ?? 0) - (usage.get(b.recipeId) ?? 0));
      for (const match of candidates) {
        const recipe = recipes.get(match.recipeId);
        if (!recipe) continue;
        const short = shortages(stock, recipe, weekPeople, catalog, counts);
        if (short.length > 0) {
          for (const id of short) ranOut.add(getIngredient(catalog, id).name);
          continue;
        }
        stock = withdraw(stock, recipe, weekPeople, catalog);
        usage.set(match.recipeId, (usage.get(match.recipeId) ?? 0) + 1);
        changes.push({ day, meal, recipeId: match.recipeId, reason: reasonFor(match) });
        break;
      }
    }
  }
  return { changes, ranOut: [...ranOut] };
}

/** Lo que se pensaba mercar y ninguna receta del menú usa: se agrega aparte al mercado. */
export function unusedPurchases(
  ingredientIds: string[],
  slots: PlannedSlot[],
  recipes: ReadonlyMap<string, Recipe>,
): string[] {
  const used = new Set(
    slots.flatMap((slot) => recipes.get(slot.recipeId)?.ingredients.map((line) => line.ingredientId) ?? []),
  );
  return ingredientIds.filter((id) => !used.has(id));
}
