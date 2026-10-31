"use server";

import { NUTRITION_STYLES } from "@/domain/menu-styles";
import {
  consumeAiRequest,
  consumeFreeWeeklyMenu,
  refundAiRequest,
  refundFreeWeeklyMenu,
  type QuotaUsage,
} from "@/features/entitlements/data";
import { requireHousehold } from "@/features/household/data";
import { loadWeek } from "@/features/week-plan/load-week";
import { weekStartSchema } from "@/features/week-plan/schemas";
import { buildAssistantContext } from "./build-context";
import { getAssistantClient } from "./client";
import { assistantRequestSchema, type AssistantRequest } from "./schemas";
import { runAssistant, type AssistantOutcome } from "./service";

/** Fallas propias del plan, distintas de las del proveedor de IA. */
export type PlanErrorKind = "not_entitled" | "limit_reached" | "free_menu_used";

export type AskAssistantResult = (
  AssistantOutcome | { ok: false; error: { kind: PlanErrorKind; detail: string } }
) & { simulated: boolean; quota: QuotaUsage | null };

/**
 * Pide una propuesta al asistente. No guarda nada: la persona revisa y decide.
 * Los planes pagos tienen tope diario; en Gratis hay una propuesta de menú por semana. La
 * consulta se descuenta antes de llamar a la IA y se devuelve si la IA falla.
 */
export async function askAssistant(request: AssistantRequest): Promise<AskAssistantResult> {
  const household = await requireHousehold();
  const parsed = assistantRequestSchema.safeParse(request);
  if (!parsed.success || !weekStartSchema.safeParse(parsed.data.weekStart).success) {
    return {
      ok: false,
      error: { kind: "invalid_response", detail: "Solicitud inválida" },
      simulated: false,
      quota: null,
    };
  }

  const { weekStart, mode, instruction, onlyEmpty, focus, style } = parsed.data;
  const { allowed, quota } = await consumeAiRequest(household.id);
  // En Gratis, "Proponer" puede usar el menú de la semana; lo demás sigue siendo de los planes pagos.
  const usesFreeMenu = !allowed && quota.plan === "free" && mode === "propose";
  if (usesFreeMenu && !(await consumeFreeWeeklyMenu(household.id))) {
    return {
      ok: false,
      error: { kind: "free_menu_used", detail: "free_menu_used" },
      simulated: false,
      quota,
    };
  }
  if (!allowed && !usesFreeMenu) {
    const kind: PlanErrorKind = quota.plan === "free" ? "not_entitled" : "limit_reached";
    return { ok: false, error: { kind, detail: kind }, simulated: false, quota };
  }
  const usage: QuotaUsage = usesFreeMenu ? { ...quota, freeMenuAvailable: false } : quota;

  const context = await buildAssistantContext({
    week: await loadWeek(weekStart),
    mode,
    instruction,
    onlyEmpty,
    focus,
    // Los estilos que se estiman con nutrición son de los planes pagos.
    style: style && NUTRITION_STYLES.has(style) && quota.plan === "free" ? null : style,
  });
  const { client, simulated } = getAssistantClient(context);
  const outcome = await runAssistant(client, context);

  if (outcome.ok) return { ...outcome, simulated, quota: usage };

  // El detalle técnico queda en los logs del servidor; a la persona le llega un mensaje claro.
  console.error("[asistente]", mode, outcome.error.kind, outcome.error.detail);
  if (usesFreeMenu) {
    await refundFreeWeeklyMenu(household.id);
    return { ...outcome, simulated, quota: { ...quota, freeMenuAvailable: true } };
  }
  await refundAiRequest(household.id);
  return { ...outcome, simulated, quota: { ...quota, used: Math.max(quota.used - 1, 0) } };
}
