import { CATEGORY_LABELS, INGREDIENT_CATEGORIES } from "@/domain/categories";
import type { Ingredient } from "@/domain/types";
import { UNIT_NAMES, type Unit } from "@/domain/units";
import type { SelectOption } from "@/ui/select";

/** Ingredientes agrupados por categoría, en el orden en que se recorre el mercado. */
export function ingredientOptions(ingredients: Ingredient[]): SelectOption<string>[] {
  return INGREDIENT_CATEGORIES.flatMap((category) =>
    ingredients
      .filter((ingredient) => ingredient.category === category)
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .map((ingredient) => ({
        value: ingredient.id,
        label: ingredient.name,
        group: CATEGORY_LABELS[category],
      })),
  );
}

/** Unidades con su nombre completo, que es como se eligen ("mililitros", no "ml"). */
export const unitOptions = (units: Unit[]): SelectOption<Unit>[] =>
  units.map((unit) => ({ value: unit, label: UNIT_NAMES[unit] }));

export const categoryOptions = INGREDIENT_CATEGORIES.map((category) => ({
  value: category,
  label: CATEGORY_LABELS[category],
}));
