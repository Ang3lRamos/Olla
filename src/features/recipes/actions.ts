"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { compatibleUnits } from "@/domain/units";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRecipe } from "./data";
import {
  flattenRecipeErrors,
  recipeFormSchema,
  type RecipeFieldErrors,
  type RecipeFormValues,
} from "./schemas";

export interface RecipeFormState {
  error?: string;
  fieldErrors?: RecipeFieldErrors;
}

const SAVE_ERROR = "No pudimos guardar la receta. Revisa tu conexión y vuelve a intentarlo.";
const DUPLICATE_NAME = "Ya tienes una receta con ese nombre.";
// Códigos de Postgres que llegan a través de PostgREST.
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

async function unitErrors(values: RecipeFormValues): Promise<RecipeFieldErrors> {
  const { catalog } = await getCatalog();
  const errors: RecipeFieldErrors = {};
  values.ingredients.forEach((line, index) => {
    const ingredient = catalog.get(line.ingredientId);
    if (!ingredient) errors[`ingredients.${index}.ingredientId`] = "Ese ingrediente ya no existe.";
    else if (!compatibleUnits(ingredient).includes(line.unit)) {
      errors[`ingredients.${index}.unit`] = "Esa unidad no aplica para este ingrediente.";
    }
  });
  return errors;
}

async function persistRecipe(householdId: string, values: RecipeFormValues) {
  const supabase = await createSupabaseServerClient();
  return supabase.rpc("save_household_recipe", {
    // El id nulo crea una receta nueva; `supabase gen types` no refleja que el argumento admite null.
    target_recipe_id: values.id as string,
    target_household_id: householdId,
    recipe_name: values.name,
    recipe_category: values.category,
    servings: values.baseServings,
    minutes: values.prepMinutes as number,
    recipe_steps: values.steps,
    ingredients: values.ingredients.map((line) => ({
      ingredient_id: line.ingredientId,
      quantity: line.quantity,
      unit: line.unit,
      note: line.note,
    })),
  });
}

export async function saveRecipe(_: RecipeFormState, formData: FormData): Promise<RecipeFormState> {
  const household = await requireHousehold();
  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: SAVE_ERROR };
  }

  const parsed = recipeFormSchema.safeParse(payload);
  if (!parsed.success) return { fieldErrors: flattenRecipeErrors(parsed.error) };
  const fieldErrors = await unitErrors(parsed.data);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const { data: recipeId, error } = await persistRecipe(household.id, parsed.data);
  if (error?.code === UNIQUE_VIOLATION) return { fieldErrors: { name: DUPLICATE_NAME } };
  if (error || !recipeId) return { error: SAVE_ERROR };

  revalidatePath("/recetas", "layout");
  redirect(`/recetas/${recipeId}`);
}

export async function deleteRecipe(recipeId: string): Promise<{ error: string }> {
  const household = await requireHousehold();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId)
    .eq("household_id", household.id);
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    return { error: "Esta receta está en un menú. Quítala de la semana antes de borrarla." };
  }
  if (error) return { error: "No pudimos borrar la receta. Vuelve a intentarlo." };

  revalidatePath("/recetas", "layout");
  redirect("/recetas");
}

/** Copia una receta (p. ej. del catálogo global) al hogar para poder editarla. */
export async function duplicateRecipe(recipeId: string): Promise<{ error: string }> {
  const household = await requireHousehold();
  const original = await getRecipe(recipeId);
  if (!original) return { error: "Esa receta ya no existe." };

  const values: RecipeFormValues = {
    id: null,
    name: `${original.name} (mi versión)`,
    category: original.category,
    baseServings: original.baseServings,
    prepMinutes: original.prepMinutes,
    steps: original.steps,
    ingredients: original.ingredients.map((line) => ({
      ingredientId: line.ingredientId,
      quantity: line.quantity.amount,
      unit: line.quantity.unit,
      note: line.note ?? "",
    })),
  };
  const { data: copyId, error } = await persistRecipe(household.id, values);
  if (error?.code === UNIQUE_VIOLATION) {
    return { error: `Ya tienes "${values.name}". Ábrela desde Recetas para editarla.` };
  }
  if (error || !copyId) return { error: "No pudimos duplicar la receta. Vuelve a intentarlo." };

  revalidatePath("/recetas", "layout");
  redirect(`/recetas/${copyId}/editar`);
}
