import { describe, expect, it } from "vitest";
import { adminMetrics, bogotaDay, planStatusOf, type AdminPayment, type AdminUser } from "./metrics";

const NOW = new Date("2026-10-23T15:00:00Z");

const user = (id: string, createdAt: string, householdId: string | null, extra: Partial<AdminUser> = {}) => ({
  id,
  email: `${id}@example.com`,
  createdAt,
  lastSignInAt: null,
  confirmed: true,
  householdId,
  ...extra,
});

const payment = (householdId: string, extra: Partial<AdminPayment> = {}): AdminPayment => ({
  reference: `ref-${householdId}`,
  householdId,
  plan: "pro",
  period: "month",
  amountCop: 19_900,
  status: "APPROVED",
  method: "CARD",
  createdAt: "2026-10-10T12:00:00Z",
  ...extra,
});

describe("bogotaDay", () => {
  it("agrupa por el día de Colombia, no por el UTC", () => {
    expect(bogotaDay(new Date("2026-10-23T03:00:00Z"))).toBe("2026-10-22");
  });
});

describe("planStatusOf", () => {
  const paid = new Set(["h-paid"]);
  it("distingue pago, prueba, cortesía y vencido", () => {
    const future = "2026-11-01T00:00:00Z";
    expect(planStatusOf({ householdId: "h-paid", plan: "basic", expiresAt: future }, paid, NOW)).toBe(
      "basic",
    );
    expect(planStatusOf({ householdId: "h-new", plan: "pro", expiresAt: future }, paid, NOW)).toBe("trial");
    expect(planStatusOf({ householdId: "h-own", plan: "pro", expiresAt: null }, paid, NOW)).toBe("courtesy");
    expect(
      planStatusOf({ householdId: "h-paid", plan: "pro", expiresAt: "2026-10-01T00:00:00Z" }, paid, NOW),
    ).toBe("free");
    expect(planStatusOf(undefined, paid, NOW)).toBe("free");
  });
});

describe("adminMetrics", () => {
  const metrics = adminMetrics(
    {
      users: [
        user("a", "2026-10-22T20:00:00Z", "h1", { lastSignInAt: "2026-10-22T20:00:00Z" }),
        user("b", "2026-09-01T12:00:00Z", "h2"),
        user("c", "2026-10-20T12:00:00Z", null, { confirmed: false }),
      ],
      entitlements: [
        { householdId: "h1", plan: "pro", expiresAt: "2026-11-10T00:00:00Z" },
        { householdId: "h2", plan: "basic", expiresAt: "2027-01-01T00:00:00Z" },
      ],
      payments: [
        payment("h1"),
        payment("h2", {
          plan: "basic",
          period: "quarter",
          amountCop: 24_900,
          createdAt: "2026-09-01T12:00:00Z",
        }),
        payment("h1", { reference: "ref-x", status: "DECLINED" }),
      ],
      aiUsage: [
        { householdId: "h1", usedOn: "2026-10-23", requests: 3 },
        { householdId: "h1", usedOn: "2026-10-01", requests: 2 },
      ],
    },
    NOW,
  );

  it("cuenta usuarios nuevos, activos y sin confirmar", () => {
    expect(metrics.totals).toEqual({
      users: 3,
      newUsers7: 2,
      newUsers30: 2,
      active7: 1,
      unconfirmed: 1,
      households: 2,
    });
  });

  it("lleva el trimestral a un mes y solo suma pagos aprobados", () => {
    expect(metrics.plans).toMatchObject({ pro: 1, basic: 1, free: 0 });
    expect(metrics.mrrCop).toBe(19_900 + 8_300);
    expect(metrics.revenueThisMonthCop).toBe(19_900);
    expect(metrics.revenueTotalCop).toBe(44_800);
    expect(metrics.revenueSeries.map((point) => [point.label, point.value]).slice(-2)).toEqual([
      ["sep", 24_900],
      ["oct", 19_900],
    ]);
  });

  it("suma el asistente de hoy y de los últimos 30 días", () => {
    expect(metrics.aiToday).toBe(3);
    expect(metrics.ai30).toBe(5);
    expect(metrics.aiSeries).toHaveLength(30);
    expect(metrics.userRows[0]).toMatchObject({ id: "a", status: "pro", ai30: 5 });
  });
});
