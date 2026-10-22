import type { AiErrorKind } from "@/lib/ai/types";
import type { PlanErrorKind } from "../actions";

/** Qué decirle a la persona en cada falla; el detalle técnico queda en los logs. */
export const ASSISTANT_ERROR_MESSAGES: Record<AiErrorKind | PlanErrorKind, { title: string; body: string }> =
  {
    not_entitled: {
      title: "El asistente es parte de los planes Básico y Pro",
      body: "Olla te propone el menú y lo ajusta con tus palabras. Pruébalo 7 días gratis o elige un plan; mientras tanto puedes planear la semana a mano.",
    },
    limit_reached: {
      title: "Llegaste al límite de hoy",
      body: "Ya usaste todas las consultas del asistente por hoy. Se renuevan a medianoche.",
    },
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
    rate_limited: {
      title: "El asistente está muy solicitado",
      body: "Hay muchas consultas en este momento. Intenta de nuevo en un minuto; tu semana no cambió.",
    },
    invalid_response: {
      title: "La respuesta no se pudo usar",
      body: "El asistente respondió algo que no cumplía el formato. Suele funcionar al segundo intento.",
    },
  };

export const ADJUST_EXAMPLES = ["Cambia el pescado", "Esta semana estoy corto de plata", "Quiero más sopas"];
