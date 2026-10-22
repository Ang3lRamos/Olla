import type { RecipeCategory } from "@/domain/recipe-categories";
import { MEALS, type Meal } from "@/domain/week";
import { normalizeForSearch } from "@/features/recipes/search";
import type { AiClient, AiResult, JsonRequest } from "@/lib/ai/types";
import type { AssistantContext, CatalogRecipe } from "./context";
import { isExcluded } from "./sanitize";
import type { AiProposal } from "./schemas";

/**
 * "IA" de reglas simples para desarrollo y demos, sin proveedor real. Responde por el mismo
 * camino que un modelo (esquema + depuración), así la interfaz se prueba de verdad.
 * Instrucciones especiales para probar errores: «simular error», «simular lento»,
 * «simular respuesta inválida».
 */

const PREFERRED: Record<Meal, RecipeCategory[]> = {
  breakfast: ["breakfast"],
  lunch: ["main", "soup"],
  dinner: ["light", "soup", "main"],
};

/** Palabras que un hogar usa y no aparecen tal cual en los ingredientes. */
const SYNONYMS: Record<string, string[]> = {
  pescado: ["mojarra"],
  carne: ["res"],
  pollo: ["pollo", "gallina", "pechuga"],
  granos: ["frijol", "lenteja", "garbanzo"],
};

const SAVING_WORDS = /plata|barat|econom|presupuesto|ahorr|corto/;
const MAX_REPEATS = 2;

interface SimulatedDeps {
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export function createSimulatedAssistantClient(
  context: AssistantContext,
  deps: SimulatedDeps = {},
): AiClient {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const instruction = normalizeForSearch(context.instruction);

  return {
    async completeJson<T>(request: JsonRequest<T>): Promise<AiResult<T>> {
      await sleep(instruction.includes("simular lento") ? 8000 : (deps.delayMs ?? 700));
      if (instruction.includes("simular error")) {
        return { ok: false, error: { kind: "unavailable", detail: "Error simulado" } };
      }
      if (instruction.includes("simular respuesta invalida")) {
        return { ok: false, error: { kind: "invalid_response", detail: "Respuesta simulada inválida" } };
      }
      const parsed = request.schema.safeParse(simulateProposal(context));
      return parsed.success
        ? { ok: true, data: parsed.data }
        : { ok: false, error: { kind: "invalid_response", detail: parsed.error.message } };
    },
  };
}

function simulateProposal(context: AssistantContext): AiProposal {
  switch (context.mode) {
    case "propose":
      return proposeWeek(context);
    case "adjust":
      return adjustWeek(context);
    case "review-notes":
      return reviewNotes(context);
  }
}

const text = (recipe: CatalogRecipe) =>
  normalizeForSearch([recipe.name, ...recipe.ingredientNames].join(" "));

function usageOf(context: AssistantContext) {
  const usage = new Map<string, number>();
  for (const slot of context.slots) usage.set(slot.recipeId, (usage.get(slot.recipeId) ?? 0) + 1);
  return usage;
}

/** La opción más barata y menos repetida para una comida, sin repetir más de dos veces. */
function pickFor(
  meal: Meal,
  context: AssistantContext,
  usage: Map<string, number>,
  avoid: (r: CatalogRecipe) => boolean,
) {
  const fitting = context.recipes.filter(
    (recipe) =>
      PREFERRED[meal].includes(recipe.category) && !avoid(recipe) && !isExcluded(recipe, context.exclude),
  );
  const leastUsedFirst = (a: CatalogRecipe, b: CatalogRecipe) =>
    (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0) || a.costPerServingCop - b.costPerServingCop;
  // Si no alcanza el catálogo para respetar el máximo de repeticiones, se repite antes que dejar vacío.
  const varied = fitting.filter((recipe) => (usage.get(recipe.id) ?? 0) < MAX_REPEATS);
  const choice = (varied.length ? varied : fitting).sort(leastUsedFirst)[0];
  if (choice) usage.set(choice.id, (usage.get(choice.id) ?? 0) + 1);
  return choice;
}

function proposeWeek(context: AssistantContext): AiProposal {
  const occupied = new Set(context.slots.map((slot) => `${slot.day}-${slot.meal}`));
  const usage = context.onlyEmpty ? usageOf(context) : new Map<string, number>();
  const changes: AiProposal["changes"] = [];

  for (let day = 0; day < 7; day++) {
    for (const meal of MEALS) {
      if (context.onlyEmpty && occupied.has(`${day}-${meal}`)) continue;
      const recipe = pickFor(meal, context, usage, () => false);
      if (recipe) changes.push({ day, meal, recipeId: recipe.id, reason: "Económica y sin repetirse mucho" });
    }
  }
  return {
    summary:
      "Armé un menú variado priorizando recetas económicas y sin repetir ninguna más de dos veces (modo simulado).",
    changes,
  };
}

function adjustWeek(context: AssistantContext): AiProposal {
  const recipes = new Map(context.recipes.map((recipe) => [recipe.id, recipe]));
  const usage = usageOf(context);
  const instruction = normalizeForSearch(context.instruction);

  if (SAVING_WORDS.test(instruction)) {
    const expensive = context.slots
      .filter((slot) => recipes.has(slot.recipeId))
      .sort((a, b) => recipes.get(b.recipeId)!.costPerServingCop - recipes.get(a.recipeId)!.costPerServingCop)
      .slice(0, 3);
    const changes = expensive.flatMap((slot) => {
      const current = recipes.get(slot.recipeId)!;
      const cheaper = pickFor(
        slot.meal,
        context,
        usage,
        (recipe) => recipe.costPerServingCop >= current.costPerServingCop,
      );
      return cheaper
        ? [
            {
              day: slot.day,
              meal: slot.meal,
              recipeId: cheaper.id,
              reason: `Más económica que ${current.name}`,
            },
          ]
        : [];
    });
    return { summary: "Cambié las comidas más costosas por opciones más baratas (modo simulado).", changes };
  }

  const words = instruction.split(/\s+/).filter((word) => word.length >= 4);
  const terms = words.flatMap((word) => SYNONYMS[word] ?? [word]);
  const matches = (recipe: CatalogRecipe) => terms.some((term) => text(recipe).includes(term));
  const targets = context.slots.filter(
    (slot) => recipes.has(slot.recipeId) && matches(recipes.get(slot.recipeId)!),
  );
  if (targets.length === 0) {
    return {
      summary:
        "En modo simulado no encontré qué cambiar con esa instrucción. Prueba «cambia el pescado» o «estoy corto de plata».",
      changes: [],
    };
  }
  const changes = targets.flatMap((slot) => {
    const replacement = pickFor(slot.meal, context, usage, matches);
    return replacement
      ? [{ day: slot.day, meal: slot.meal, recipeId: replacement.id, reason: "Cambio pedido" }]
      : [];
  });
  return {
    summary: "Reemplacé lo que pediste por otras opciones de la misma comida (modo simulado).",
    changes,
  };
}

function reviewNotes(context: AssistantContext): AiProposal {
  const recipes = new Map(context.recipes.map((recipe) => [recipe.id, recipe]));
  const byName = (name: string) => context.recipes.find((recipe) => normalizeForSearch(recipe.name) === name);
  const changes: AiProposal["changes"] = [];
  const reasons: string[] = [];

  for (const note of context.notes) {
    const body = normalizeForSearch(note.body);
    const calentado = byName("calentado");
    if (
      /sobro|sobra/.test(body) &&
      /arroz|frijol/.test(body) &&
      note.day !== null &&
      note.day < 6 &&
      calentado
    ) {
      const nextBreakfast = context.slots.find(
        (slot) => slot.day === note.day! + 1 && slot.meal === "breakfast",
      );
      // Si el desayuno siguiente ya es calentado no hay nada que cambiar; no se sugiere un cambio vacío.
      if (nextBreakfast?.recipeId !== calentado.id) {
        changes.push({
          day: note.day + 1,
          meal: "breakfast",
          recipeId: calentado.id,
          reason: `Aprovecha lo que sobró: «${note.body}»`,
        });
        reasons.push("aprovechar sobrantes en un calentado");
      }
    }
    if (/no (les )?gust/.test(body) && note.day !== null && note.meal) {
      const disliked = context.slots.find(
        (slot) => slot.day === note.day && slot.meal === note.meal,
      )?.recipeId;
      const usage = usageOf(context);
      for (const slot of context.slots.filter((item) => item.recipeId === disliked && item.day > note.day!)) {
        const replacement = pickFor(slot.meal, context, usage, (recipe) => recipe.id === disliked);
        if (replacement) {
          changes.push({
            day: slot.day,
            meal: slot.meal,
            recipeId: replacement.id,
            reason: `No gustó ${recipes.get(disliked!)?.name ?? "esa receta"}`,
          });
          reasons.push("evitar lo que no gustó");
        }
      }
    }
  }
  return {
    summary: reasons.length
      ? `Según tus notas, sugiero ${[...new Set(reasons)].join(" y ")} (modo simulado).`
      : "Tus notas no sugieren cambios para esta semana (modo simulado).",
    changes,
  };
}
