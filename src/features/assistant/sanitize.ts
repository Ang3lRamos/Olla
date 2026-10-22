import type { Meal } from "@/domain/week";
import { normalizeForSearch } from "@/features/recipes/search";
import type { AssistantContext, CatalogRecipe } from "./context";
import type { AiProposal } from "./schemas";

export interface ProposedChange {
  day: number;
  meal: Meal;
  recipeId: string | null;
  reason: string | null;
}

export type DiscardReason = "unknown-recipe" | "excluded" | "occupied-slot" | "clear-not-allowed";

export interface SanitizedProposal {
  summary: string;
  changes: ProposedChange[];
  discarded: Array<{ day: number; meal: Meal; reason: DiscardReason }>;
}

/** Una receta queda prohibida si su nombre o algún ingrediente contiene algo de "no incluir". */
export function isExcluded(recipe: CatalogRecipe, exclude: string[]): boolean {
  const text = normalizeForSearch([recipe.name, ...recipe.ingredientNames].join(" "));
  return exclude.some((term) => {
    const normalized = normalizeForSearch(term);
    return normalized.length > 0 && text.includes(normalized);
  });
}

/**
 * Lo que diga la IA nunca se aplica tal cual: aquí se descartan ids inventados, recetas
 * prohibidas por el hogar y cambios que el modo no permite. El código manda, no el modelo.
 */
export function sanitizeProposal(proposal: AiProposal, context: AssistantContext): SanitizedProposal {
  const recipes = new Map(context.recipes.map((recipe) => [recipe.id, recipe]));
  const current = new Map(context.slots.map((slot) => [`${slot.day}-${slot.meal}`, slot.recipeId]));
  const bySlot = new Map<string, ProposedChange>();
  const discarded: SanitizedProposal["discarded"] = [];

  for (const change of proposal.changes) {
    const key = `${change.day}-${change.meal}`;
    const discard = (reason: DiscardReason) => discarded.push({ day: change.day, meal: change.meal, reason });

    if (context.mode === "propose" && context.onlyEmpty && current.has(key)) {
      discard("occupied-slot");
      continue;
    }
    if (change.recipeId === null) {
      if (context.mode === "propose") discard("clear-not-allowed");
      else if (current.has(key))
        bySlot.set(key, { ...change, recipeId: null, reason: change.reason ?? null });
      continue;
    }
    const recipe = recipes.get(change.recipeId);
    if (!recipe) {
      discard("unknown-recipe");
      continue;
    }
    if (isExcluded(recipe, context.exclude)) {
      discard("excluded");
      continue;
    }
    // Si la receta ya está en esa casilla no es un cambio; se ignora sin avisar.
    if (current.get(key) === recipe.id) continue;
    bySlot.set(key, {
      day: change.day,
      meal: change.meal,
      recipeId: recipe.id,
      reason: change.reason ?? null,
    });
  }

  const changes = [...bySlot.values()].sort(byDayAndMeal);
  return { summary: proposal.summary, changes, discarded };
}

const MEAL_ORDER: Record<Meal, number> = { breakfast: 0, lunch: 1, dinner: 2 };

export const byDayAndMeal = (a: ProposedChange, b: ProposedChange) =>
  a.day - b.day || MEAL_ORDER[a.meal] - MEAL_ORDER[b.meal];
