"use server";

import { revalidatePath } from "next/cache";
import { compatibleUnits } from "@/domain/units";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ingredientPriceSchema, type IngredientPriceInput } from "./schemas";

export type PriceActionResult = { ok: true } | { ok: false; error: string };

const SAVE_ERROR = "No pudimos guardar el precio. Revisa tu conexión y vuelve a intentarlo.";

// Los precios cambian costos en la semana, el mercado y las recetas.
const revalidatePrices = () => revalidatePath("/", "layout");

/** Guarda el precio propio del hogar; reemplaza al de referencia en todos los cálculos. */
export async function saveIngredientPrice(input: IngredientPriceInput): Promise<PriceActionResult> {
  const household = await requireHousehold();
  const parsed = ingredientPriceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? SAVE_ERROR };

  const { catalog } = await getCatalog();
  const ingredient = catalog.get(parsed.data.ingredientId);
  if (!ingredient || !compatibleUnits(ingredient).includes(parsed.data.perUnit)) {
    return { ok: false, error: "Esa unidad no aplica para este ingrediente." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ingredient_prices").upsert(
    {
      household_id: household.id,
      ingredient_id: parsed.data.ingredientId,
      price_cop: parsed.data.priceCop,
      per_amount: parsed.data.perAmount,
      per_unit: parsed.data.perUnit,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "household_id,ingredient_id" },
  );
  if (error) return { ok: false, error: SAVE_ERROR };

  revalidatePrices();
  return { ok: true };
}

/** Borra el precio propio: el ingrediente vuelve a usar el de referencia. */
export async function resetIngredientPrice(ingredientId: string): Promise<PriceActionResult> {
  const household = await requireHousehold();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("ingredient_prices")
    .delete()
    .eq("household_id", household.id)
    .eq("ingredient_id", ingredientId);
  if (error) return { ok: false, error: "No pudimos restablecer el precio. Vuelve a intentarlo." };

  revalidatePrices();
  return { ok: true };
}
