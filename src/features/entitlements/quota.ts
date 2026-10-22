export interface AiQuota {
  plan: "free" | "pro";
  dailyLimit: number;
  used: number;
}

export const FREE_QUOTA: AiQuota = { plan: "free", dailyLimit: 0, used: 0 };

export const remainingRequests = (quota: AiQuota) => Math.max(quota.dailyLimit - quota.used, 0);
export const hasAssistant = (quota: AiQuota) => quota.plan === "pro" && quota.dailyLimit > 0;
