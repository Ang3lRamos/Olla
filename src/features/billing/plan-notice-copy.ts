import type { PlanNotice } from "./plan-notice";
import { PLAN_NAMES } from "./plans";

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  timeZone: "America/Bogota",
});

const when = (days: number) => (days === 0 ? "hoy" : days === 1 ? "mañana" : `en ${days} días`);
const remaining = (days: number) => (days === 0 ? "termina hoy" : days === 1 ? "1 día" : `${days} días`);

export interface NoticeCopy {
  title: string;
  body: string;
  action: string;
  /** Lo corto que se ve en la barra cuando la persona pidió no recordar más. */
  badge: string;
}

/** Los textos del aviso del plan, iguales en la alerta y en la etiqueta de la barra. */
export function noticeCopy(notice: PlanNotice): NoticeCopy {
  const name = PLAN_NAMES[notice.plan];
  if (notice.kind === "ending") {
    return notice.trial
      ? {
          title: `Tu prueba de Pro termina ${when(notice.days)}`,
          body: "Elige un plan para seguir pidiéndole el menú al asistente. Sin plan, todo lo demás sigue igual.",
          action: "Ver planes",
          badge: `Prueba: ${remaining(notice.days)}`,
        }
      : {
          title: `Tu plan ${name} vence ${when(notice.days)}`,
          body: "No se renueva solo: renuévalo para no perder el asistente.",
          action: `Renovar ${name}`,
          badge: `${name}: ${notice.days === 0 ? "vence hoy" : remaining(notice.days)}`,
        };
  }
  return {
    title: notice.trial
      ? "Terminó tu prueba de Pro"
      : `Tu plan ${name} venció el ${DATE_FORMAT.format(new Date(notice.endedAt))}`,
    body: "Volviste al plan gratis: la semana, el mercado y tus recetas siguen igual, sin el asistente.",
    action: "Ver planes",
    badge: notice.trial ? "Prueba terminada" : `${name} vencido`,
  };
}
