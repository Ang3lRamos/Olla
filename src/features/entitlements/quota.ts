export interface AiQuota {
  plan: "free" | "pro";
  /** null = sin límite (cuentas puntuales, como la del dueño). */
  dailyLimit: number | null;
  used: number;
}

export const FREE_QUOTA: AiQuota = { plan: "free", dailyLimit: 0, used: 0 };

/** Consultas que quedan hoy; null si no hay límite. */
export const remainingRequests = (quota: AiQuota) =>
  quota.dailyLimit === null ? null : Math.max(quota.dailyLimit - quota.used, 0);

export const hasAssistant = (quota: AiQuota) => quota.plan === "pro" && quota.dailyLimit !== 0;
