export const PLANS = ["free", "basic", "pro"] as const;
export type Plan = (typeof PLANS)[number];

export interface AiQuota {
  plan: Plan;
  /** null = sin límite (cuentas puntuales, como la del dueño). */
  dailyLimit: number | null;
  used: number;
  /** Hasta cuándo dura el plan pago o la prueba; null si no vence o es gratis. */
  expiresAt: string | null;
  trialUsed: boolean;
}

export const FREE_QUOTA: AiQuota = {
  plan: "free",
  dailyLimit: 0,
  used: 0,
  expiresAt: null,
  trialUsed: false,
};

/** Consultas que quedan hoy; null si no hay límite. */
export const remainingRequests = (quota: AiQuota) =>
  quota.dailyLimit === null ? null : Math.max(quota.dailyLimit - quota.used, 0);

export const hasAssistant = (quota: AiQuota) => quota.plan !== "free" && quota.dailyLimit !== 0;
