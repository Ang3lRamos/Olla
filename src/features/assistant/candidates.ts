import type { CatalogRecipe } from "./context";
import { isExcluded } from "./sanitize";

/** Recetas que se le mandan al modelo como máximo; más allá, el mensaje crece sin ayudar. */
export const MAX_CANDIDATES = 60;

interface SelectCandidatesInput {
  recipes: CatalogRecipe[];
  exclude: string[];
  /** Recetas que ya están en la semana: siempre van, para que el modelo pueda hablar de ellas. */
  inWeek: Set<string>;
  /** Ingredientes en la despensa (normalizados no hace falta: se comparan por nombre exacto). */
  pantryNames: Set<string>;
  limit?: number;
}

/**
 * Preselección determinística (en vez de búsqueda por similitud): quita lo prohibido y, si
 * el catálogo es grande, prioriza lo que ya está en la semana, lo que usa la despensa y lo
 * más económico.
 */
export function selectCandidates({
  recipes,
  exclude,
  inWeek,
  pantryNames,
  limit = MAX_CANDIDATES,
}: SelectCandidatesInput): CatalogRecipe[] {
  const allowed = recipes.filter((recipe) => inWeek.has(recipe.id) || !isExcluded(recipe, exclude));
  if (allowed.length <= limit) return allowed;

  const pantryHits = (recipe: CatalogRecipe) =>
    recipe.ingredientNames.filter((name) => pantryNames.has(name)).length;
  return [...allowed]
    .sort(
      (a, b) =>
        Number(inWeek.has(b.id)) - Number(inWeek.has(a.id)) ||
        pantryHits(b) - pantryHits(a) ||
        a.costPerServingCop - b.costPerServingCop,
    )
    .slice(0, limit);
}
