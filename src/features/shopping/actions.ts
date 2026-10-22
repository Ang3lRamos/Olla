"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { INGREDIENT_CATEGORIES } from "@/domain/categories";
import { requireHousehold } from "@/features/household/data";
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

/** Marca como comprado guardando cuánto se compró, para notar si el menú cambia después. */
export async function markPurchased(input: z.input<typeof purchaseSchema>): Promise<ShoppingActionResult> {
  const household = await requireHousehold();
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };

  const supabase = await createSupabaseServerClient();
  const weekPlanId = await ensureWeekPlan(supabase, household, parsed.data.weekStart);
  if (!weekPlanId) return { ok: false, error: SAVE_ERROR };

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
  return error ? { ok: false, error: SAVE_ERROR } : done();
}

export async function unmarkPurchased(
  input: z.input<typeof purchaseKeySchema>,
): Promise<ShoppingActionResult> {
  await requireHousehold();
  const parsed = purchaseKeySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };

  const supabase = await createSupabaseServerClient();
  const weekPlanId = await findWeekPlanId(supabase, parsed.data.weekStart);
  if (!weekPlanId) return done();

  const { error } = await supabase
    .from("shopping_purchases")
    .delete()
    .eq("week_plan_id", weekPlanId)
    .eq("ingredient_id", parsed.data.ingredientId)
    .eq("unit", parsed.data.unit);
  return error ? { ok: false, error: SAVE_ERROR } : done();
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
