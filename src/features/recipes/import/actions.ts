"use server";

import { getCatalog } from "@/features/catalog/data";
import { consumeAiRequest, refundAiRequest } from "@/features/entitlements/data";
import { requireHousehold } from "@/features/household/data";
import { readAiConfig, SIMULATED_AI_BASE_URL } from "@/lib/ai/config";
import { createHttpAiClient } from "@/lib/ai/http-client";
import { buildRecipeImportMessages } from "./prompt";
import { aiRecipeSchema, MAX_IMPORT_TEXT, MIN_IMPORT_TEXT } from "./schema";
import { simulateRecipeImport } from "./simulated";
import { toImportedRecipe, type ImportedRecipe } from "./to-draft";

export type ImportResult =
  | { ok: true; recipe: ImportedRecipe; simulated: boolean }
  | { ok: false; error: string; needsPlan?: boolean };

const UNAVAILABLE = "El asistente no pudo leer la receta ahora. Intenta en un momento o llénala a mano.";

/**
 * Lee una receta pegada y la devuelve lista para el formulario. Cuenta como una consulta del
 * asistente (se devuelve si falla) y no guarda nada: la persona revisa y decide.
 */
export async function importRecipeText(text: string): Promise<ImportResult> {
  const household = await requireHousehold();
  const clean = text.trim();
  if (clean.length < MIN_IMPORT_TEXT)
    return { ok: false, error: "Pega la receta completa, con ingredientes y pasos." };
  if (clean.length > MAX_IMPORT_TEXT) return { ok: false, error: `Hasta ${MAX_IMPORT_TEXT} caracteres.` };
  const config = readAiConfig();
  if (!config) return { ok: false, error: "El asistente no está disponible por ahora." };

  const { allowed, quota } = await consumeAiRequest(household.id);
  if (!allowed) {
    return quota.plan === "free"
      ? { ok: false, error: "Pegar recetas con el asistente es de los planes Básico y Pro.", needsPlan: true }
      : { ok: false, error: "Ya usaste las consultas del asistente de hoy. Se renuevan a medianoche." };
  }

  const { ingredients } = await getCatalog();
  if (config.baseUrl === SIMULATED_AI_BASE_URL) {
    const parsed = aiRecipeSchema.safeParse(simulateRecipeImport(clean));
    if (parsed.success)
      return { ok: true, recipe: toImportedRecipe(parsed.data, ingredients), simulated: true };
  } else {
    const result = await createHttpAiClient(config).completeJson({
      schema: aiRecipeSchema,
      messages: buildRecipeImportMessages(clean),
      temperature: 0.1,
    });
    if (result.ok) return { ok: true, recipe: toImportedRecipe(result.data, ingredients), simulated: false };
    console.error("[recetas] no se pudo leer la receta", result.error.kind, result.error.detail);
  }
  await refundAiRequest(household.id);
  return { ok: false, error: UNAVAILABLE };
}
