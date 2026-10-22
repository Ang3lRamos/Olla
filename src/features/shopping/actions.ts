"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { INGREDIENT_CATEGORIES } from "@/domain/categories";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { changeStock } from "@/features/pantry/stock";
import { weekStartSchema } from "@/features/week-plan/schemas";
import { ensureWeekPlan, findWeekPlanId } from "@/features/week-plan/week-plan-id";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ShoppingActionResult = { ok: true } | { ok: false; error: string };

const SAVE_ERROR = "No pudimos guardar el cambio en el mercado. Revisa tu conexión y vuelve a intentarlo.";
const INVALID = "Ese cambio no es válido.";

const purchaseKeySchema = z.object({
  weekStart: weekStartSchema,
  ingredientId: z.uuid(),
  unit: z.enum(["g", "ml", "unit"]),
});

const purchaseSchema = purchaseKeySchema.extend({ quantity: z.number().positive() });

const extraSchema = z.object({
  weekStart: weekStartSchema,
  name: z.string().trim().min(1, "Escribe qué hace falta.").max(80, "Hasta 80 caracteres."),
  category: z.enum(INGREDIENT_CATEGORIES),
});

const done = (): ShoppingActionResult => {
  revalidatePath("/mercado");
  return { ok: true };
};

// Lo comprado entra a la despensa, así que cambia también la semana y la propia despensa.
const doneWithStock = (): ShoppingActionResult => {
  revalidatePath("/", "layout");
  return { ok: true };
};

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function purchasedBefore(supabase: Supabase, weekPlanId: string, ingredientId: string, unit: string) {
  const { data } = await supabase
    .from("shopping_purchases")
    .select("quantity")
    .eq("week_plan_id", weekPlanId)
    .eq("ingredient_id", ingredientId)
    .eq("unit", unit)
    .maybeSingle();
  return data?.quantity ?? 0;
}

/**
 * Marca como comprado guardando cuánto se compró (paquetes completos), para notar si el menú
 * cambia después. Lo comprado entra a la despensa; si ya estaba marcado, solo la diferencia.
 */
export async function markPurchased(input: z.input<typeof purchaseSchema>): Promise<ShoppingActionResult> {
  const household = await requireHousehold();
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };

  const supabase = await createSupabaseServerClient();
  const weekPlanId = await ensureWeekPlan(supabase, household, parsed.data.weekStart);
  if (!weekPlanId) return { ok: false, error: SAVE_ERROR };

  const { ingredientId, unit, quantity } = parsed.data;
  const before = await purchasedBefore(supabase, weekPlanId, ingredientId, unit);
  const { catalog } = await getCatalog();
  if (!catalog.has(ingredientId)) return { ok: false, error: INVALID };
  const stocked = await changeStock(
    supabase,
    household.id,
    [{ ingredientId, quantity: { amount: quantity - before, unit } }],
    catalog,
  );
  if (!stocked) return { ok: false, error: SAVE_ERROR };

  const { error } = await supabase.from("shopping_purchases").upsert(
    {
      week_plan_id: weekPlanId,
      ingredient_id: parsed.data.ingredientId,
      unit: parsed.data.unit,
      quantity: parsed.data.quantity,
      purchased_at: new Date().toISOString(),
    },
    { onConflict: "week_plan_id,ingredient_id,unit" },
  );
  return error ? { ok: false, error: SAVE_ERROR } : doneWithStock();
}

export async function unmarkPurchased(
  input: z.input<typeof purchaseKeySchema>,
): Promise<ShoppingActionResult> {
  const household = await requireHousehold();
  const parsed = purchaseKeySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };

  const supabase = await createSupabaseServerClient();
  const weekPlanId = await findWeekPlanId(supabase, parsed.data.weekStart);
  if (!weekPlanId) return done();

  // Se devuelve lo que entró a la despensa al marcarlo; si ya se usó, no baja de cero.
  const { ingredientId, unit } = parsed.data;
  const before = await purchasedBefore(supabase, weekPlanId, ingredientId, unit);
  const { catalog } = await getCatalog();
  if (before > 0 && catalog.has(ingredientId)) {
    const stocked = await changeStock(
      supabase,
      household.id,
      [{ ingredientId, quantity: { amount: -before, unit } }],
      catalog,
    );
    if (!stocked) return { ok: false, error: SAVE_ERROR };
  }

  const { error } = await supabase
    .from("shopping_purchases")
    .delete()
    .eq("week_plan_id", weekPlanId)
    .eq("ingredient_id", parsed.data.ingredientId)
    .eq("unit", parsed.data.unit);
  return error ? { ok: false, error: SAVE_ERROR } : doneWithStock();
}

export async function addExtra(input: z.input<typeof extraSchema>): Promise<ShoppingActionResult> {
  const household = await requireHousehold();
  const parsed = extraSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? INVALID };

  const supabase = await createSupabaseServerClient();
  const weekPlanId = await ensureWeekPlan(supabase, household, parsed.data.weekStart);
  if (!weekPlanId) return { ok: false, error: SAVE_ERROR };

  const { error } = await supabase
    .from("shopping_extras")
    .insert({ week_plan_id: weekPlanId, name: parsed.data.name, category: parsed.data.category });
  return error ? { ok: false, error: SAVE_ERROR } : done();
}

export async function setExtraChecked(extraId: string, checked: boolean): Promise<ShoppingActionResult> {
  await requireHousehold();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("shopping_extras").update({ checked }).eq("id", extraId);
  return error ? { ok: false, error: SAVE_ERROR } : done();
}

export async function removeExtra(extraId: string): Promise<ShoppingActionResult> {
  await requireHousehold();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("shopping_extras").delete().eq("id", extraId);
  return error ? { ok: false, error: SAVE_ERROR } : done();
}
