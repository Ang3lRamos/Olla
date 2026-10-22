"use server";

import { requireHousehold } from "@/features/household/data";
import { loadWeek } from "@/features/week-plan/load-week";
import { weekStartSchema } from "@/features/week-plan/schemas";
import { buildAssistantContext } from "./build-context";
import { getAssistantClient } from "./client";
import { assistantRequestSchema, type AssistantRequest } from "./schemas";
import { runAssistant, type AssistantOutcome } from "./service";

export type AskAssistantResult = AssistantOutcome & { simulated: boolean };

/** Pide una propuesta al asistente. No guarda nada: la persona revisa y decide. */
export async function askAssistant(request: AssistantRequest): Promise<AskAssistantResult> {
  await requireHousehold();
  const parsed = assistantRequestSchema.safeParse(request);
  if (!parsed.success || !weekStartSchema.safeParse(parsed.data.weekStart).success) {
    return { ok: false, error: { kind: "invalid_response", detail: "Solicitud inválida" }, simulated: false };
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

  // El detalle técnico queda en los logs del servidor; a la persona le llega un mensaje claro.
  if (!outcome.ok) console.error("[asistente]", mode, outcome.error.kind, outcome.error.detail);
  return { ...outcome, simulated };
}
