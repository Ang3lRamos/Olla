import type { Period } from "@/features/billing/plans";
import type { Plan } from "@/features/entitlements/quota";

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  householdId: string | null;
}

export interface AdminEntitlement {
  householdId: string;
  plan: Plan;
  expiresAt: string | null;
}

export interface AdminPayment {
  reference: string;
  householdId: string;
  plan: Exclude<Plan, "free">;
  period: Period;
  amountCop: number;
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
  method: string | null;
  createdAt: string;
}

export interface AdminAiUsage {
  householdId: string;
  usedOn: string;
  requests: number;
}

/** Cómo está hoy el plan de un hogar; "trial" y "courtesy" no pagan. */
export type PlanStatus = "free" | "basic" | "pro" | "trial" | "courtesy";

export interface SeriesPoint {
  key: string;
  label: string;
  value: number;
}

const DAY_MS = 86_400_000;
const TIME_ZONE = "America/Bogota";

/** Fecha "aaaa-mm-dd" en hora de Colombia, para agrupar por día sin que la medianoche UTC parta el día. */
export const bogotaDay = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });

const lastDays = (now: Date, count: number) =>
  Array.from({ length: count }, (_, index) =>
    bogotaDay(new Date(now.getTime() - (count - 1 - index) * DAY_MS)),
  );

const dayLabel = (day: string) => {
  const [, month, date] = day.split("-");
  return `${Number(date)}/${Number(month)}`;
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Plan vigente de cada hogar: vencido = gratis; sin pago aprobado = prueba; sin vencimiento = cortesía. */
export function planStatusOf(
  entitlement: AdminEntitlement | undefined,
  paidHouseholds: Set<string>,
  now: Date,
): PlanStatus {
  if (!entitlement || entitlement.plan === "free") return "free";
  if (entitlement.expiresAt === null) return "courtesy";
  if (new Date(entitlement.expiresAt) <= now) return "free";
  return paidHouseholds.has(entitlement.householdId) ? entitlement.plan : "trial";
}

interface Snapshot {
  users: AdminUser[];
  entitlements: AdminEntitlement[];
  payments: AdminPayment[];
  aiUsage: AdminAiUsage[];
}

export function adminMetrics({ users, entitlements, payments, aiUsage }: Snapshot, now: Date) {
  const approved = payments.filter((payment) => payment.status === "APPROVED");
  const paidHouseholds = new Set(approved.map((payment) => payment.householdId));
  const entitlementOf = new Map(entitlements.map((item) => [item.householdId, item]));
  const statusOf = (householdId: string | null) =>
    householdId ? planStatusOf(entitlementOf.get(householdId), paidHouseholds, now) : "free";

  const since = (days: number) => now.getTime() - days * DAY_MS;
  const households = [...new Set(users.flatMap((user) => user.householdId ?? []))];
  const plans: Record<PlanStatus, number> = { free: 0, basic: 0, pro: 0, trial: 0, courtesy: 0 };
  households.forEach((householdId) => plans[statusOf(householdId)]++);

  // Ingreso mensual recurrente: el último pago aprobado de cada hogar que hoy paga, llevado a un mes.
  const latestPaid = new Map<string, AdminPayment>();
  approved
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))
    .forEach((payment) => latestPaid.set(payment.householdId, payment));
  const mrrCop = [...latestPaid.values()]
    .filter((payment) => ["basic", "pro"].includes(statusOf(payment.householdId)))
    .reduce((sum, payment) => sum + payment.amountCop / (payment.period === "quarter" ? 3 : 1), 0);

  const thisMonth = bogotaDay(now).slice(0, 7);
  const today = bogotaDay(now);
  const days30 = lastDays(now, 30);
  const signupsByDay = countBy(users.map((user) => bogotaDay(new Date(user.createdAt))));
  const aiByDay = new Map<string, number>();
  aiUsage.forEach((row) => aiByDay.set(row.usedOn, (aiByDay.get(row.usedOn) ?? 0) + row.requests));
  const aiByHousehold = new Map<string, number>();
  aiUsage
    .filter((row) => days30.includes(row.usedOn))
    .forEach((row) =>
      aiByHousehold.set(row.householdId, (aiByHousehold.get(row.householdId) ?? 0) + row.requests),
    );

  return {
    totals: {
      users: users.length,
      newUsers7: users.filter((user) => new Date(user.createdAt).getTime() >= since(7)).length,
      newUsers30: users.filter((user) => new Date(user.createdAt).getTime() >= since(30)).length,
      active7: users.filter((user) => user.lastSignInAt && new Date(user.lastSignInAt).getTime() >= since(7))
        .length,
      unconfirmed: users.filter((user) => !user.confirmed).length,
      households: households.length,
    },
    plans,
    mrrCop: Math.round(mrrCop),
    revenueThisMonthCop: approved
      .filter((payment) => bogotaDay(new Date(payment.createdAt)).startsWith(thisMonth))
      .reduce((sum, payment) => sum + payment.amountCop, 0),
    revenueTotalCop: approved.reduce((sum, payment) => sum + payment.amountCop, 0),
    aiToday: aiByDay.get(today) ?? 0,
    ai30: days30.reduce((sum, day) => sum + (aiByDay.get(day) ?? 0), 0),
    signupSeries: days30.map((day) => ({
      key: day,
      label: dayLabel(day),
      value: signupsByDay.get(day) ?? 0,
    })),
    aiSeries: days30.map((day) => ({ key: day, label: dayLabel(day), value: aiByDay.get(day) ?? 0 })),
    revenueSeries: revenueByMonth(approved, now, 6),
    userRows: users
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((user) => ({
        ...user,
        status: statusOf(user.householdId),
        expiresAt: user.householdId ? (entitlementOf.get(user.householdId)?.expiresAt ?? null) : null,
        ai30: user.householdId ? (aiByHousehold.get(user.householdId) ?? 0) : 0,
      })),
  };
}

function countBy(keys: string[]) {
  const counts = new Map<string, number>();
  keys.forEach((key) => counts.set(key, (counts.get(key) ?? 0) + 1));
  return counts;
}

function revenueByMonth(approved: AdminPayment[], now: Date, count: number): SeriesPoint[] {
  const [year, month] = bogotaDay(now).split("-").map(Number) as [number, number];
  return Array.from({ length: count }, (_, index) => {
    const offset = month - 1 - (count - 1 - index);
    const y = year + Math.floor(offset / 12);
    const m = ((offset % 12) + 12) % 12;
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    const value = approved
      .filter((payment) => bogotaDay(new Date(payment.createdAt)).startsWith(key))
      .reduce((sum, payment) => sum + payment.amountCop, 0);
    return { key, label: MONTHS[m]!, value };
  });
}

export type AdminMetrics = ReturnType<typeof adminMetrics>;
