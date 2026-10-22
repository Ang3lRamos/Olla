import type { AiClient, AiError } from "@/lib/ai/types";
import type { AssistantContext } from "./context";
import { buildAssistantMessages } from "./prompts";
import { sanitizeProposal, type SanitizedProposal } from "./sanitize";
import { aiProposalSchema } from "./schemas";

export type AssistantOutcome = ({ ok: true } & SanitizedProposal) | { ok: false; error: AiError };

/**
 * Pide una propuesta y la depura. No escribe nada: el usuario revisa y decide si la aplica.
 * Recibe el cliente por parámetro para poder probarlo con uno simulado.
 */
export async function runAssistant(
  client: AiClient | null,
  context: AssistantContext,
): Promise<AssistantOutcome> {
  if (!client) {
    return { ok: false, error: { kind: "not_configured", detail: "Faltan AI_BASE_URL / AI_MODEL" } };
  }
  const result = await client.completeJson({
    schema: aiProposalSchema,
    messages: buildAssistantMessages(context),
    temperature: context.mode === "propose" ? 0.6 : 0.3,
  });
  if (!result.ok) return result;
  return { ok: true, ...sanitizeProposal(result.data, context) };
}
