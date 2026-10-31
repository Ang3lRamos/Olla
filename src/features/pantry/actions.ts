"use server";

import { revalidatePath } from "next/cache";
import { compatibleUnits } from "@/domain/units";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pantryItemSchema, type PantryItemInput } from "./schemas";

export type PantryActionResult = { ok: true } | { ok: false; error: string };

const SAVE_ERROR = "No pudimos guardar. Revisa tu conexión y vuelve a intentarlo.";

/** Agrega o actualiza un producto: la despensa tiene una sola fila por ingrediente. */
export async function savePantryItem(input: PantryItemInput): Promise<PantryActionResult> {
  const household = await requireHousehold();
  const parsed = pantryItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? SAVE_ERROR };

  const { catalog } = await getCatalog();
  const ingredient = catalog.get(parsed.data.ingredientId);
  if (!ingredient || !compatibleUnits(ingredient).includes(parsed.data.unit)) {
    return { ok: false, error: "Esa unidad no aplica para este ingrediente." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("pantry_items").upsert(
    {
      household_id: household.id,
      ingredient_id: parsed.data.ingredientId,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "household_id,ingredient_id" },
  );
  if (error) return { ok: false, error: SAVE_ERROR };

  // También se agrega desde la semana, y lo que hay en casa cambia el menú y el mercado.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removePantryItem(pantryItemId: string): Promise<PantryActionResult> {
  const household = await requireHousehold();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", pantryItemId)
    .eq("household_id", household.id);
  if (error) return { ok: false, error: "No pudimos quitarlo. Vuelve a intentarlo." };

  revalidatePath("/despensa");
  return { ok: true };
}
