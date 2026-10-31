import "server-only";
import { getIngredient } from "@/domain/catalog";
import { styleLevels, styleScore, type MenuStyle } from "@/domain/menu-styles";
import { formatQuantity, toIngredientBase } from "@/domain/units";
import { addDays, dayIndex } from "@/domain/week";
import { summarizeWeek } from "@/domain/week-plan";
import { listNotesBetween } from "@/features/notes/data";
import { summarizeRecipe } from "@/features/recipes/data";
import { getShoppingState } from "@/features/shopping/data";
import type { loadWeek } from "@/features/week-plan/load-week";
import { selectCandidates } from "./candidates";
import type { AssistantContext, CatalogRecipe } from "./context";
import type { AssistantMode } from "./schemas";

type LoadedWeek = Awaited<ReturnType<typeof loadWeek>>;

/** Topes para que ninguna consulta crezca sin control: el costo de cada una queda acotado. */
export const MAX_NOTES = 30;
export const MAX_PANTRY_ITEMS = 100;
export const MAX_MARKET_EXTRAS = 30;

interface BuildContextInput {
  week: LoadedWeek;
  mode: AssistantMode;
  instruction: string;
  onlyEmpty: boolean;
  focus?: string[];
  style?: MenuStyle | null;
}

/** Reúne lo que el asistente necesita, con todos los números ya calculados por el dominio. */
export async function buildAssistantContext({
  week,
  mode,
  instruction,
  onlyEmpty,
  focus = [],
  style = null,
}: BuildContextInput): Promise<AssistantContext> {
  const { catalog, prices, household, plan, pantry } = week;
  // Las notas de la semana anterior ayudan a no repetir lo que no gustó.
  const [notes, { extras }] = await Promise.all([
    listNotesBetween(addDays(week.weekStart, -7), week.weekEnd),
    getShoppingState(plan.id),
  ]);

  const levels = style
    ? styleLevels(week.recipes.map((recipe) => styleScore(style, recipe, catalog, prices)))
    : [];
  const recipes: CatalogRecipe[] = week.recipes.map((recipe, index) => {
    const summary = summarizeRecipe(recipe, catalog, prices);
    return {
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      prepMinutes: recipe.prepMinutes,
      costPerServingCop: summary.costPerServingCop,
      ingredientNames: recipe.ingredients.map((line) => getIngredient(catalog, line.ingredientId).name),
      styleFit: levels[index],
    };
  });
  const pantryNames = pantry.map((item) => getIngredient(catalog, item.ingredientId).name);
  const market = summarizeWeek({
    slots: plan.slots,
    recipes: new Map(week.recipes.map((recipe) => [recipe.id, recipe])),
    weekPeople: plan.people,
    pantry,
    catalog,
    prices,
  }).market.totalCop;

  return {
    mode,
    instruction,
    onlyEmpty,
    people: plan.people,
    weeklyBudgetCop: household.weeklyBudgetCop,
    currentMarketCop: market,
    exclude: household.preferences.exclude,
    slots: plan.slots,
    recipes: selectCandidates({
      recipes,
      exclude: household.preferences.exclude,
      inWeek: new Set(plan.slots.map((slot) => slot.recipeId)),
      // Lo que se pidió aprovechar cuenta como despensa para elegir las candidatas.
      pantryNames: new Set([...pantryNames, ...focus]),
    }),
    marketExtras: extras.slice(0, MAX_MARKET_EXTRAS).map((extra) => extra.name),
    focus,
    style,
    pantry: pantry.slice(0, MAX_PANTRY_ITEMS).map((item) => {
      const ingredient = getIngredient(catalog, item.ingredientId);
      return `${ingredient.name}: ${formatQuantity(toIngredientBase(item.quantity, ingredient))}`;
    }),
    // Las más recientes primero: son las que más dicen de esta semana.
    notes: [...notes]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, MAX_NOTES)
      .map((note) => ({
        day: dayIndex(week.weekStart, note.date),
        meal: note.meal,
        body: note.body,
      })),
  };
}
