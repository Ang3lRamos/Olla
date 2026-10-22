import type { AiErrorKind } from "@/lib/ai/types";

/** Qué decirle a la persona en cada falla; el detalle técnico queda en los logs. */
export const ASSISTANT_ERROR_MESSAGES: Record<AiErrorKind, { title: string; body: string }> = {
  not_configured: {
    title: "El asistente no está disponible",
    body: "Todavía no está conectado a un modelo de IA. Puedes seguir planeando la semana a mano.",
  },
  timeout: {
    title: "El asistente tardó demasiado",
    body: "Los modelos gratuitos a veces se demoran. Intenta de nuevo; tu semana no cambió.",
  },
  unavailable: {
    title: "No pudimos hablar con el asistente",
    body: "Puede ser la conexión o el proveedor. Intenta de nuevo en un momento; tu semana no cambió.",
  },
  invalid_response: {
    title: "La respuesta no se pudo usar",
    body: "El asistente respondió algo que no cumplía el formato. Suele funcionar al segundo intento.",
  },
};

export const ADJUST_EXAMPLES = ["Cambia el pescado", "Esta semana estoy corto de plata", "Quiero más sopas"];
