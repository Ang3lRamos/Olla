import { MENU_STYLE_LABELS } from "@/domain/menu-styles";
import { MEAL_LABELS } from "@/domain/week";
import type { ChatMessage } from "@/lib/ai/types";
import type { AssistantContext } from "./context";

const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

const SYSTEM_PROMPT = `Eres el asistente de Olla, una app para organizar las comidas de un hogar en Colombia.
Ayudas a armar menús variados, cotidianos y que cuiden el presupuesto.

Reglas:
- Solo eliges recetas del catálogo que te doy, usando su "id" exacto. Nunca inventes recetas ni ids.
- No calculas cantidades, porciones ni precios: eso lo hace la app.
- Nunca propongas recetas que contengan algo de la lista "no incluir".
- No des consejos médicos ni nutricionales, ni hables de calorías o dietas.
- Para desayuno prefiere recetas de categoría "breakfast"; para almuerzo, "main" o "soup"; para comida, "light", "soup" o "main".
- Varía: evita repetir la misma receta más de dos veces en la semana.
- Si hay presupuesto, intenta que el mercado no lo supere.
- "despensa" es lo que ya hay en casa y "extras_del_mercado" lo que el hogar ya decidió comprar: aprovéchalos cuando tenga sentido (p. ej. recetas que usen esos productos).
- "para_usar" es lo que la persona compró o tiene y pidió aprovechar: es la prioridad. Elige sobre todo recetas que usen esos ingredientes y, en "summary", cuenta cuáles aprovechaste.
- Si hay "estilo", prefiere las recetas con "encaje_estilo" alto (de 1 a 5) sin dejar de variar. Es una preferencia del hogar, no una dieta: no menciones cifras de nutrición.
- "summary" y "reason" los lee la persona: escríbelos en español natural, nombrando las recetas por su nombre. Nunca menciones ids, categorías internas (breakfast, main…) ni nombres de campos.
- Días: 0 = lunes … 6 = domingo. Comidas: "breakfast" (desayuno), "lunch" (almuerzo), "dinner" (comida).

Responde SOLO con un objeto JSON, sin texto antes ni después, con esta forma:
{"summary": "explicación breve en español (máx. 3 frases)", "changes": [{"day": 0, "meal": "lunch", "recipeId": "id-del-catalogo", "reason": "motivo corto"}]}
Usa "recipeId": null solo si hay que dejar una casilla vacía.`;

function taskFor(context: AssistantContext): string {
  switch (context.mode) {
    case "propose":
      return context.onlyEmpty
        ? "Propón recetas para las casillas vacías de la semana. No cambies las que ya tienen receta."
        : "Propón un menú para toda la semana (las 21 casillas). Puedes reemplazar lo que haya.";
    case "adjust":
      return `Ajusta la semana según esta instrucción del usuario: «${context.instruction}». Devuelve solo las casillas que cambian.`;
    case "review-notes":
      return "Lee las notas y sugiere cambios concretos en la semana: aprovechar sobrantes, evitar lo que no gustó, repetir lo que gustó. Devuelve solo las casillas que cambian. Si las notas no sugieren cambios, devuelve changes vacío y explícalo en summary.";
  }
}

/** Mensajes para el modelo: reglas fijas en el sistema y los datos del hogar en JSON. */
export function buildAssistantMessages(context: AssistantContext): ChatMessage[] {
  const data = {
    personas: context.people,
    presupuesto_semanal_cop: context.weeklyBudgetCop,
    mercado_actual_cop: context.currentMarketCop,
    no_incluir: context.exclude,
    despensa: context.pantry,
    extras_del_mercado: context.marketExtras,
    para_usar: context.focus,
    estilo: context.style ? MENU_STYLE_LABELS[context.style] : null,
    semana_actual: context.slots.map((slot) => ({
      day: slot.day,
      meal: slot.meal,
      recipeId: slot.recipeId,
      dia: DAY_NAMES[slot.day],
      comida: MEAL_LABELS[slot.meal],
    })),
    notas: context.notes.map((note) => ({
      dia: note.day === null ? "semana anterior" : DAY_NAMES[note.day],
      comida: note.meal ? MEAL_LABELS[note.meal] : "todo el día",
      texto: note.body,
    })),
    catalogo: context.recipes.map((recipe) => ({
      id: recipe.id,
      nombre: recipe.name,
      category: recipe.category,
      minutos: recipe.prepMinutes,
      costo_por_porcion_cop: recipe.costPerServingCop,
      ingredientes: recipe.ingredientNames,
      encaje_estilo: recipe.styleFit,
    })),
  };

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `${taskFor(context)}\n\nDatos del hogar:\n${JSON.stringify(data)}` },
  ];
}
