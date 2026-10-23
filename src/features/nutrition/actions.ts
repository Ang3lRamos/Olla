"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/household/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { goalsInputSchema, type GoalsInput } from "./schemas";

export type GoalsResult = { ok: true } | { ok: false; error: string };

/** Guarda las metas de la persona: las que quedan vacías se borran. */
export async function saveGoals(input: GoalsInput): Promise<GoalsResult> {
  const user = await requireUser();
  const parsed = goalsInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa las metas." };

  const supabase = await createSupabaseServerClient();
  const kept = parsed.data.filter((goal) => goal.target !== null);
  const removed = parsed.data.filter((goal) => goal.target === null).map((goal) => goal.nutrient);
  if (kept.length) {
    const { error } = await supabase.from("nutrition_goals").upsert(
      kept.map((goal) => ({
        user_id: user.id,
        nutrient: goal.nutrient,
        target: goal.target!,
        direction: goal.direction,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,nutrient" },
    );
    if (error) return { ok: false, error: "No pudimos guardar tus metas. Vuelve a intentarlo." };
  }
  if (removed.length) {
    const { error } = await supabase
      .from("nutrition_goals")
      .delete()
      .eq("user_id", user.id)
      .in("nutrient", removed);
    if (error) return { ok: false, error: "No pudimos guardar tus metas. Vuelve a intentarlo." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
