import { addBusinessDays, bogotaDay } from "@/domain/business-days";

/** Días hábiles para arrepentirse con devolución total (Ley 1480, art. 47). */
export const RETRACT_BUSINESS_DAYS = 5;

/** Último día (hora de Colombia) para pedir el reembolso de un pago, y si hoy todavía se puede. */
export function refundWindow(paidAt: string, now: Date) {
  const deadline = addBusinessDays(bogotaDay(new Date(paidAt)), RETRACT_BUSINESS_DAYS);
  return { deadline, open: bogotaDay(now) <= deadline };
}
