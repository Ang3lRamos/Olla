"use server";

import { consumeAiRequest, refundAiRequest, type AiQuota } from "@/features/entitlements/data";
import { requireHousehold } from "@/features/household/data";
import { loadWeek } from "@/features/week-plan/load-week";
import { weekStartSchema } from "@/features/week-plan/schemas";
import { buildAssistantContext } from "./build-context";
import { getAssistantClient } from "./client";
import { assistantRequestSchema, type AssistantRequest } from "./schemas";
import { runAssistant, type AssistantOutcome } from "./service";

/** Fallas propias del plan, distintas de las del proveedor de IA. */
export type PlanErrorKind = "not_entitled" | "limit_reached";

export type AskAssistantResult = (
  AssistantOutcome | { ok: false; error: { kind: PlanErrorKind; detail: string } }
) & { simulated: boolean; quota: AiQuota | null };

/**
 * Pide una propuesta al asistente. No guarda nada: la persona revisa y decide.
 * Solo para el plan Pro y con tope diario; la consulta se descuenta antes de llamar a la IA
 * y se devuelve si la IA falla.
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

  const { allowed, quota } = await consumeAiRequest(household.id);
  if (!allowed) {
    const kind: PlanErrorKind = quota.plan === "pro" ? "limit_reached" : "not_entitled";
    return { ok: false, error: { kind, detail: kind }, simulated: false, quota };
  }

  const { weekStart, mode, instruction, onlyEmpty } = parsed.data;
  const context = await buildAssistantContext({
    week: await loadWeek(weekStart),
    mode,
    instruction,
    onlyEmpty,
  });
  const { client, simulated } = getAssistantClient(context);
  const outcome = await runAssistant(client, context);

  if (outcome.ok) return { ...outcome, simulated, quota };

  // El detalle técnico queda en los logs del servidor; a la persona le llega un mensaje claro.
  console.error("[asistente]", mode, outcome.error.kind, outcome.error.detail);
  await refundAiRequest(household.id);
  return { ...outcome, simulated, quota: { ...quota, used: Math.max(quota.used - 1, 0) } };
}
