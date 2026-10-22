import "server-only";
import { readAiConfig, SIMULATED_AI_BASE_URL } from "@/lib/ai/config";
import { createHttpAiClient } from "@/lib/ai/http-client";
import type { AiClient } from "@/lib/ai/types";
import type { AssistantContext } from "./context";
import { createSimulatedAssistantClient } from "./simulated-client";

/** El único lugar que decide qué hay detrás del asistente: proveedor real, simulado o nada. */
export function getAssistantClient(context: AssistantContext): {
  client: AiClient | null;
  simulated: boolean;
} {
  const config = readAiConfig();
  if (!config) return { client: null, simulated: false };
  if (config.baseUrl === SIMULATED_AI_BASE_URL) {
    return { client: createSimulatedAssistantClient(context), simulated: true };
  }
  return { client: createHttpAiClient(config), simulated: false };
}
