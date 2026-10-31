import type { RecipeCategory } from "@/domain/recipe-categories";
import { MEALS, type Meal } from "@/domain/week";
import type { AssistantContext, CatalogRecipe } from "./context";
import { byDayAndMeal, isExcluded, type ProposedChange, type SanitizedProposal } from "./sanitize";

export const PREFERRED_CATEGORIES: Record<Meal, RecipeCategory[]> = {
  breakfast: ["breakfast"],
  lunch: ["main", "soup"],
  dinner: ["light", "soup", "main"],
};

const MAX_REPEATS = 2;
export const FILLED_BY_APP_REASON = "Olla la eligió para no dejar la casilla vacía";

export function countUsage(recipeIds: Iterable<string>): Map<string, number> {
  const usage = new Map<string, number>();
  for (const id of recipeIds) usage.set(id, (usage.get(id) ?? 0) + 1);
  return usage;
}

/**
 * La opción más barata y menos repetida para una comida, sin repetir más de dos veces.
 * Anota la elección en `usage` para que la siguiente casilla la tenga en cuenta.
 */
export function pickRecipeFor(
  meal: Meal,
  context: AssistantContext,
  usage: Map<string, number>,
  avoid: (recipe: CatalogRecipe) => boolean = () => false,
): CatalogRecipe | undefined {
  const fitting = context.recipes.filter(
    (recipe) =>
      PREFERRED_CATEGORIES[meal].includes(recipe.category) &&
      !avoid(recipe) &&
      !isExcluded(recipe, context.exclude),
  );
  const leastUsedFirst = (a: CatalogRecipe, b: CatalogRecipe) =>
    (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0) ||
    (b.styleFit ?? 0) - (a.styleFit ?? 0) ||
    a.costPerServingCop - b.costPerServingCop;
  // Si no alcanza el catálogo para respetar el máximo de repeticiones, se repite antes que dejar vacío.
  const varied = fitting.filter((recipe) => (usage.get(recipe.id) ?? 0) < MAX_REPEATS);
  const choice = (varied.length ? varied : fitting).sort(leastUsedFirst)[0];
  if (choice) usage.set(choice.id, (usage.get(choice.id) ?? 0) + 1);
  return choice;
}

/**
 * Al proponer, los modelos a veces devuelven menos casillas de las pedidas. Las que quedan
 * vacías las completa el código con la misma regla de variedad y costo, marcadas como tales.
 */
export function fillEmptySlots(proposal: SanitizedProposal, context: AssistantContext): SanitizedProposal {
  const week = new Map<string, string | null>(
    context.slots.map((slot) => [`${slot.day}-${slot.meal}`, slot.recipeId]),
  );
  for (const change of proposal.changes) week.set(`${change.day}-${change.meal}`, change.recipeId);
  const usage = countUsage([...week.values()].filter((id): id is string => id !== null));

  const filled: ProposedChange[] = [];
  for (let day = 0; day < 7; day++) {
    for (const meal of MEALS) {
      if (week.get(`${day}-${meal}`)) continue;
      const recipe = pickRecipeFor(meal, context, usage);
      if (recipe) filled.push({ day, meal, recipeId: recipe.id, reason: FILLED_BY_APP_REASON });
    }
  }
  if (filled.length === 0) return proposal;
  return { ...proposal, changes: [...proposal.changes, ...filled].sort(byDayAndMeal) };
}
