import type { Plan } from "@/features/entitlements/quota";

export const PERIODS = ["month", "quarter"] as const;
export type Period = (typeof PERIODS)[number];
export type PaidPlan = Exclude<Plan, "free">;

export interface PlanPrice {
  plan: PaidPlan;
  period: Period;
  amountCop: number;
  days: number;
  aiDailyLimit: number;
}

export const PLAN_NAMES: Record<Plan, string> = { free: "Gratis", basic: "Básico", pro: "Pro" };

export const PLAN_PITCH: Record<Plan, string> = {
  free: "Para planear a mano, sin asistente.",
  basic: "Para planear la semana con ayuda.",
  pro: "Para ajustar el menú cuantas veces quieras.",
};

export const PERIOD_LABELS: Record<Period, { name: string; per: string }> = {
  month: { name: "Mensual", per: "al mes" },
  quarter: { name: "Trimestral", per: "cada 3 meses" },
};

/** Lo que todos los planes tienen; los pagos se diferencian solo en el asistente. */
export const INCLUDED_IN_ALL = [
  "Recetas colombianas y las tuyas",
  "Semana, mercado y despensa sin límite",
  "Presupuesto con tus precios",
];

/** Ahorro del trimestral frente a pagar tres meses, en porcentaje entero. */
export function quarterlySavingsPercent(prices: PlanPrice[], plan: PaidPlan): number | null {
  const month = prices.find((price) => price.plan === plan && price.period === "month");
  const quarter = prices.find((price) => price.plan === plan && price.period === "quarter");
  if (!month || !quarter) return null;
  return Math.round((1 - quarter.amountCop / (month.amountCop * 3)) * 100);
}

/** Días que faltan para que venza el plan, contando hoy; null si no vence. */
export function daysLeft(expiresAt: string | null, now: Date): number | null {
  if (!expiresAt) return null;
  return Math.max(Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 86_400_000), 0);
}

/** Se avisa para renovar en los últimos días: PSE no se cobra solo. */
export const RENEWAL_NOTICE_DAYS = 5;
