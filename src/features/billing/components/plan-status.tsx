import type { AiQuota } from "@/features/entitlements/quota";
import { cn } from "@/ui/cn";
import { daysLeft, PLAN_NAMES, RENEWAL_NOTICE_DAYS } from "../plans";

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  timeZone: "America/Bogota",
});

export const formatPlanDate = (iso: string) => DATE_FORMAT.format(new Date(iso));

/** El plan actual y hasta cuándo dura; resalta cuando falta poco para que venza. */
export function PlanStatus({ quota, now }: { quota: AiQuota; now: Date }) {
  const left = daysLeft(quota.expiresAt, now);
  const endingSoon = left !== null && left <= RENEWAL_NOTICE_DAYS;

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-md border px-4 py-3",
        endingSoon ? "border-maiz bg-maiz/10" : "border-hairline",
      )}
    >
      <p className="text-sm">
        Tu plan: <span className="font-semibold">{PLAN_NAMES[quota.plan]}</span>
        {quota.plan !== "free" && quota.dailyLimit === null && " · consultas sin límite"}
      </p>
      {quota.expiresAt && left !== null && (
        <p className="text-sm text-muted">
          Vence el {formatPlanDate(quota.expiresAt)} (
          {left === 0 ? "hoy" : left === 1 ? "mañana" : `en ${left} días`}).
          {endingSoon && " No se renueva solo: renuévalo abajo para no perder el asistente."}
        </p>
      )}
    </div>
  );
}
