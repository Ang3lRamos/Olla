import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/ui/button";
import { cn } from "@/ui/cn";
import type { PlanNotice } from "../plan-notice";
import { PLAN_NAMES } from "../plans";
import { formatPlanDate } from "./plan-status";

const when = (days: number) => (days === 0 ? "hoy" : days === 1 ? "mañana" : `en ${days} días`);

function copy(notice: PlanNotice): { title: string; body: string; action: string } {
  const name = PLAN_NAMES[notice.plan];
  if (notice.kind === "ending") {
    return notice.trial
      ? {
          title: `Tu prueba de Pro termina ${when(notice.days)}`,
          body: "Elige un plan para seguir pidiéndole el menú al asistente. Sin plan, todo lo demás sigue igual.",
          action: "Ver planes",
        }
      : {
          title: `Tu plan ${name} vence ${when(notice.days)}`,
          body: "No se renueva solo: renuévalo para no perder el asistente.",
          action: `Renovar ${name}`,
        };
  }
  return {
    title: notice.trial
      ? "Terminó tu prueba de Pro"
      : `Tu plan ${name} venció el ${formatPlanDate(notice.endedAt)}`,
    body: "Volviste al plan gratis: la semana, el mercado y tus recetas siguen igual, sin el asistente.",
    action: "Ver planes",
  };
}

/** Aviso en la semana cuando el plan está por vencer o acaba de vencer. */
export function RenewalNotice({ notice }: { notice: PlanNotice }) {
  const { title, body, action } = copy(notice);
  return (
    <div
      role="status"
      className={cn(
        "flex animate-rise flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        notice.kind === "ending" ? "border-maiz bg-maiz/10" : "border-hairline",
      )}
    >
      <div className="flex items-start gap-3">
        <CalendarClock className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden />
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted">{body}</p>
        </div>
      </div>
      <Link
        href="/planes"
        className={buttonClasses({ size: "sm", className: "shrink-0 self-start sm:self-center" })}
      >
        {action}
      </Link>
    </div>
  );
}
