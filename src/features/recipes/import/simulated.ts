import type { AiRecipe } from "./schema";

const QUANTITY_LINE = /^\s*[-•*]?\s*(\d+(?:[.,]\d+)?|½|¼|¾)\s*([a-záéíóúñ.]+)?\s+(?:de\s+)?(.+)$/i;
const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75 };
const KNOWN_UNITS =
  /^(g|gr|gramos?|kg|kilos?|lb|libras?|ml|l|litros?|tazas?|cucharadas?|cucharaditas?|cdas?|dientes?|unidades?)\.?$/i;

/**
 * Lectura por reglas para desarrollo y demos (AI_BASE_URL=mock): primera línea = nombre,
 * líneas que empiezan con cantidad = ingredientes, el resto = pasos. Pasa por el mismo esquema
 * y la misma conversión que la respuesta de un modelo.
 */
export function simulateRecipeImport(text: string): AiRecipe {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const [first = "Receta", ...rest] = lines;
  const ingredients: AiRecipe["ingredients"] = [];
  const steps: string[] = [];
  let inSteps = false;
  for (const line of rest) {
    if (/^(preparaci[oó]n|pasos)\s*:?$/i.test(line)) {
      inSteps = true;
      continue;
    }
    const numberedStep = /^\d+[.)]\s/.test(line);
    const match = !inSteps && !numberedStep ? QUANTITY_LINE.exec(line) : null;
    if (match && ingredients.length < 40) {
      const [, amount = "", maybeUnit, name = ""] = match;
      const unit = maybeUnit && KNOWN_UNITS.test(maybeUnit) ? maybeUnit : null;
      ingredients.push({
        name: (unit ? name : `${maybeUnit ?? ""} ${name}`).trim(),
        quantity: FRACTIONS[amount] ?? Number(amount.replace(",", ".")),
        unit,
        note: null,
      });
    } else if (!/^(ingredientes|preparaci[oó]n|pasos)\s*:?$/i.test(line)) {
      steps.push(line.replace(/^\d+[.)-]\s*/, ""));
    }
  }
  return {
    name: first.replace(/:$/, ""),
    servings: 4,
    prepMinutes: null,
    ingredients: ingredients.length
      ? ingredients
      : [{ name: "Ingrediente", quantity: null, unit: null, note: null }],
    steps,
  };
}
