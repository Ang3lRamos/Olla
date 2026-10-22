import { CATEGORY_LABELS, INGREDIENT_CATEGORIES } from "@/domain/categories";
import type { Ingredient } from "@/domain/types";

/** Opciones de <select> agrupadas por categoría, en el orden en que se recorre el mercado. */
export function IngredientOptions({ ingredients }: { ingredients: Ingredient[] }) {
  return INGREDIENT_CATEGORIES.map((category) => {
    const options = ingredients.filter((ingredient) => ingredient.category === category);
    if (options.length === 0) return null;
    return (
      <optgroup key={category} label={CATEGORY_LABELS[category]}>
        {options.map((ingredient) => (
          <option key={ingredient.id} value={ingredient.id}>
            {ingredient.name}
          </option>
        ))}
      </optgroup>
    );
  });
}
