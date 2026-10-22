import type { Plan } from "@/features/entitlements/quota";
import { daysLeft, RENEWAL_NOTICE_DAYS } from "./plans";

export interface Entitlement {
  plan: Plan;
  /** Fecha guardada aunque ya haya pasado; null si el plan no vence. */
  expiresAt: string | null;
  /** Es la prueba gratis: el hogar la usó y nunca ha pagado un plan. */
  isTrial: boolean;
}

export type PlanNotice =
  | { kind: "ending"; plan: Plan; days: number; trial: boolean }
  | { kind: "ended"; plan: Plan; endedAt: string; trial: boolean };

/** Un plan vencido se recuerda una semana: después ya no es noticia. */
const ENDED_NOTICE_DAYS = 7;
const DAY_MS = 86_400_000;

/** Qué avisar sobre el plan en la semana: que está por vencer (PSE no se renueva solo) o que acaba de vencer. */
export function planNotice(entitlement: Entitlement | null, now: Date): PlanNotice | null {
  if (!entitlement || entitlement.plan === "free" || !entitlement.expiresAt) return null;
  const { plan, expiresAt, isTrial: trial } = entitlement;
  if (new Date(expiresAt) > now) {
    const days = daysLeft(expiresAt, now) ?? 0;
    return days <= RENEWAL_NOTICE_DAYS ? { kind: "ending", plan, days, trial } : null;
  }
  return now.getTime() - new Date(expiresAt).getTime() <= ENDED_NOTICE_DAYS * DAY_MS
    ? { kind: "ended", plan, endedAt: expiresAt, trial }
    : null;
}
