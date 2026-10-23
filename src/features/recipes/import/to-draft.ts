import type { Ingredient } from "@/domain/types";
import type { Unit } from "@/domain/units";
import { formatDecimalInput } from "@/lib/decimal-input";
import { fitUnit, matchIngredient, toUnit } from "./match";
import type { AiRecipe } from "./schema";

export interface ImportedLine {
  ingredientId: string;
  quantity: string;
  unit: Unit;
  note: string;
  /** Lo que se leyó cuando no está en el catálogo: se ofrece crearlo. */
  unmatchedName: string | null;
}

export interface ImportedRecipe {
  name: string;
  servings: number;
  prepMinutes: number | null;
  lines: ImportedLine[];
  steps: string;
}

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase("es") + text.slice(1);

/**
 * Lo que leyó el modelo, llevado al catálogo del hogar: cada ingrediente a uno existente si
 * coincide, y su unidad a una que tenga sentido para él. Lo demás queda para que la persona
 * lo cree o lo elija; nada se guarda hasta que lo revise.
 */
export function toImportedRecipe(recipe: AiRecipe, ingredients: Ingredient[]): ImportedRecipe {
  return {
    name: recipe.name,
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    steps: recipe.steps.join("\n"),
    lines: recipe.ingredients.map((line) => {
      const match = matchIngredient(line.name, ingredients);
      const written = toUnit(line.unit);
      const unit = fitUnit(written, match);
      // Si la unidad no aplica ("2 tazas" de arroz, que se mide por peso), no se inventa la
      // conversión: la cantidad queda vacía y se anota lo que decía la receta.
      const converted = unit !== written && line.quantity !== null;
      const original = converted
        ? `${formatDecimalInput(line.quantity!)} ${line.unit ?? ""} en la receta`.trim()
        : "";
      return {
        ingredientId: match?.id ?? "",
        // Sin cantidad ("sal al gusto") también se deja vacío para que la persona la ponga.
        quantity: line.quantity && !converted ? formatDecimalInput(line.quantity) : "",
        unit,
        note: [line.note, original].filter(Boolean).join(" · "),
        unmatchedName: match ? null : capitalize(line.name),
      };
    }),
  };
}
