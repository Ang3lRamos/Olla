import type { Ingredient } from "@/domain/types";
import { compatibleUnits, type Unit } from "@/domain/units";
import { normalizeForSearch } from "../search";

/** Cómo escribe la gente las unidades en una receta, llevado a las de Olla. */
const UNIT_WORDS: Array<[RegExp, Unit]> = [
  [/^(g|gr|grs|gramo|gramos)$/, "g"],
  [/^(kg|kgs|kilo|kilos|kilogramo|kilogramos)$/, "kg"],
  [/^(lb|lbs|libra|libras)$/, "lb"],
  [/^(ml|mililitro|mililitros|cc)$/, "ml"],
  [/^(l|lt|lts|litro|litros)$/, "l"],
  [/^(taza|tazas|pocillo|pocillos)$/, "cup"],
  [/^(cucharada|cucharadas|cda|cdas)$/, "tbsp"],
  [/^(cucharadita|cucharaditas|cdta|cdtas)$/, "tsp"],
];

/** "2 tazas" → cup; "dientes", "ramas", "unidades" o nada → unidad. */
export function toUnit(word: string | null | undefined): Unit {
  const clean = normalizeForSearch(word ?? "").replace(/\.$/, "");
  return UNIT_WORDS.find(([pattern]) => pattern.test(clean))?.[1] ?? "unit";
}

/**
 * Singular aproximado en español: "papas" → "papa", "tomates" → "tomate", y tras consonante
 * se quita "es": "limones" → "limon", "frijoles" → "frijol".
 */
const singular = (word: string) =>
  /[lrndzj]es$/.test(word) ? word.slice(0, -2) : word.length > 3 ? word.replace(/s$/, "") : word;
const words = (text: string) =>
  normalizeForSearch(text)
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean)
    .map(singular);

/**
 * El ingrediente del catálogo que corresponde a un nombre escrito a mano. Prefiere el nombre
 * exacto; si no, el que tenga todas sus palabras en lo escrito ("papa pastusa" en "3 papas
 * pastusas grandes"), y entre varios, el más específico.
 */
export function matchIngredient(name: string, ingredients: Ingredient[]): Ingredient | null {
  const written = new Set(words(name));
  if (written.size === 0) return null;
  const exact = ingredients.find((ingredient) => words(ingredient.name).join(" ") === [...written].join(" "));
  if (exact) return exact;
  const candidates = ingredients
    .map((ingredient) => ({ ingredient, parts: words(ingredient.name) }))
    .filter(({ parts }) => parts.length > 0 && parts.every((part) => written.has(part)))
    .sort((a, b) => b.parts.length - a.parts.length);
  return candidates[0]?.ingredient ?? null;
}

/** La unidad escrita si tiene sentido para el ingrediente; si no, la suya natural. */
export function fitUnit(unit: Unit, ingredient: Ingredient | null): Unit {
  if (!ingredient) return unit;
  const allowed = compatibleUnits(ingredient);
  return allowed.includes(unit) ? unit : (allowed[0] ?? unit);
}
