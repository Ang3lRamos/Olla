"use server";

import { revalidatePath } from "next/cache";
import type { Ingredient } from "@/domain/types";
import { requireHousehold } from "@/features/household/data";
import { normalizeForSearch } from "@/features/recipes/search";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalog } from "./data";
import {
  ingredientUpdateSchema,
  newIngredientSchema,
  type IngredientUpdateInput,
  type NewIngredientInput,
} from "./schemas";

export type IngredientResult = { ok: true; ingredient: Ingredient } | { ok: false; error: string };
export type DeleteResult = { ok: true } | { ok: false; error: string };

const SAVE_ERROR = "No pudimos guardar el producto. Revisa tu conexión y vuelve a intentarlo.";
const FOREIGN_KEY_VIOLATION = "23503";
const UNIQUE_VIOLATION = "23505";

// Un producto nuevo aparece en la despensa, el mercado, las recetas y los precios.
const revalidateCatalog = () => revalidatePath("/", "layout");

/** Evita duplicar algo que ya existe, del catálogo o del hogar, aunque cambien tildes o mayúsculas. */
async function findSameName(name: string, exceptId?: string) {
  const { ingredients } = await getCatalog();
  const wanted = normalizeForSearch(name);
  return ingredients.find((item) => item.id !== exceptId && normalizeForSearch(item.name) === wanted);
}

/** Crea un producto propio del hogar (p. ej. "Avena en hojuelas") para la despensa y las recetas. */
export async function createIngredient(input: NewIngredientInput): Promise<IngredientResult> {
  const household = await requireHousehold();
  const parsed = newIngredientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? SAVE_ERROR };
  const existing = await findSameName(parsed.data.name);
  if (existing) return { ok: true, ingredient: existing };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ingredients")
    .insert({
      household_id: household.id,
      name: parsed.data.name,
      category: parsed.data.category,
      base_unit: parsed.data.baseUnit,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: SAVE_ERROR };

  revalidateCatalog();
  return {
    ok: true,
    ingredient: { id: data.id, ...parsed.data, gramsPerUnit: null, own: true },
  };
}

/** Cambia el nombre o la categoría de un producto propio; los del catálogo no se pueden editar. */
export async function updateIngredient(input: IngredientUpdateInput): Promise<DeleteResult> {
  const household = await requireHousehold();
  const parsed = ingredientUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? SAVE_ERROR };
  if (await findSameName(parsed.data.name, parsed.data.id)) {
    return { ok: false, error: `Ya tienes un producto llamado «${parsed.data.name}».` };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("ingredients")
    .update({ name: parsed.data.name, category: parsed.data.category })
    .eq("id", parsed.data.id)
    .eq("household_id", household.id);
  if (error) {
    return {
      ok: false,
      error: error.code === UNIQUE_VIOLATION ? "Ya tienes un producto con ese nombre." : SAVE_ERROR,
    };
  }
  revalidateCatalog();
  return { ok: true };
}

/** Borra un producto propio; también sale de la despensa, los precios y el mercado. */
export async function deleteIngredient(ingredientId: string): Promise<DeleteResult> {
  const household = await requireHousehold();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("ingredients")
    .delete()
    .eq("id", ingredientId)
    .eq("household_id", household.id);
  if (error) {
    return {
      ok: false,
      error:
        error.code === FOREIGN_KEY_VIOLATION
          ? "Está en una de tus recetas. Quítalo de la receta y vuelve a intentarlo."
          : "No pudimos borrarlo. Vuelve a intentarlo.",
    };
  }
  revalidateCatalog();
  return { ok: true };
}
