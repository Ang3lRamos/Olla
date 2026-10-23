import type { ChatMessage } from "@/lib/ai/types";

const SYSTEM_PROMPT = `Lees recetas que la gente pega (de WhatsApp, una página o escritas a mano) y las ordenas.

Reglas:
- Solo usas lo que dice el texto. No inventes ingredientes, cantidades ni pasos.
- Si una cantidad no aparece ("sal al gusto"), deja "quantity": null.
- "unit" es la palabra tal como viene ("tazas", "libra", "dientes", "g"); null si no hay.
- "name" de cada ingrediente es el producto, sin la cantidad ni la unidad ("papa pastusa", no "3 papas pastusas").
- Lo que describe el ingrediente ("picada", "en cubos") va en "note".
- "servings" son las porciones que dice la receta; si no lo dice, 4.
- Cada paso es una frase corta y clara, en el orden de la receta, sin numerar.
- Todo en español.

Responde SOLO con un objeto JSON, sin texto antes ni después:
{"name": "Nombre de la receta", "servings": 4, "prepMinutes": 30, "ingredients": [{"name": "papa pastusa", "quantity": 3, "unit": "unidades", "note": "en cubos"}], "steps": ["Pela y corta las papas."]}`;

export function buildRecipeImportMessages(text: string): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Receta:\n"""\n${text}\n"""` },
  ];
}
