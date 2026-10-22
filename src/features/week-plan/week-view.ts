import type { IngredientCatalog } from "@/domain/catalog";
import { recipeCost, type PriceList } from "@/domain/costs";
import type { RecipeCategory } from "@/domain/recipe-categories";
import type { PantryItem } from "@/domain/types";
import { weekDates, weekdayLabels, MEALS, type IsoDate, type Meal } from "@/domain/week";
import type { PlannedSlot } from "@/domain/week-plan";
import type { RecipeDetail } from "@/features/recipes/types";

export interface NoteView {
  id: string;
  date: IsoDate;
  meal: Meal | null;
  body: string;
}

export interface CellView {
  day: number;
  meal: Meal;
  date: IsoDate;
  servings: number;
  isOverride: boolean;
  /** Ya se cocinó: sus ingredientes salieron de la despensa. */
  cooked: boolean;
  notes: NoteView[];
  recipe: {
    id: string;
    name: string;
    category: RecipeCategory;
    prepMinutes: number | null;
    costCop: number;
    usesPantry: boolean;
  } | null;
}

export interface DayView {
  day: number;
  date: IsoDate;
  short: string;
  long: string;
  dayOfMonth: number;
  isToday: boolean;
  cells: CellView[];
  /** Notas del día sin comida específica. */
  dayNotes: NoteView[];
}

interface BuildWeekViewInput {
  weekStart: IsoDate;
  today: IsoDate;
  people: number;
  slots: PlannedSlot[];
  recipes: ReadonlyMap<string, RecipeDetail>;
  notes: NoteView[];
  pantry: PantryItem[];
  catalog: IngredientCatalog;
  prices: PriceList;
}

export function buildWeekView(input: BuildWeekViewInput): DayView[] {
  const { weekStart, today, people, slots, recipes, notes, pantry, catalog, prices } = input;
  const inPantry = new Set(pantry.map((item) => item.ingredientId));

  return weekDates(weekStart).map((date, day) => ({
    day,
    date,
    ...weekdayLabels(date),
    isToday: date === today,
    dayNotes: notes.filter((note) => note.date === date && note.meal === null),
    cells: MEALS.map((meal): CellView => {
      const slot = slots.find((item) => item.day === day && item.meal === meal);
      const recipe = slot ? recipes.get(slot.recipeId) : undefined;
      const servings = slot?.peopleOverride ?? people;
      return {
        day,
        meal,
        date,
        servings,
        isOverride: slot?.peopleOverride != null && slot.peopleOverride !== people,
        cooked: slot?.cooked ?? false,
        notes: notes.filter((note) => note.date === date && note.meal === meal),
        recipe: recipe
          ? {
              id: recipe.id,
              name: recipe.name,
              category: recipe.category,
              prepMinutes: recipe.prepMinutes,
              costCop: recipeCost(recipe, servings, catalog, prices).totalCop,
              usesPantry: recipe.ingredients.some((line) => inPantry.has(line.ingredientId)),
            }
          : null,
      };
    }),
  }));
}

/** Cuántas veces aparece cada receta en la semana, para sugerir variedad al elegir. */
export function recipeUsage(slots: PlannedSlot[]): Map<string, number> {
  const usage = new Map<string, number>();
  for (const slot of slots) usage.set(slot.recipeId, (usage.get(slot.recipeId) ?? 0) + 1);
  return usage;
}
