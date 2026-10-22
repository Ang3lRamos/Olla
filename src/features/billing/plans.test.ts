import { describe, expect, it } from "vitest";
import { daysLeft, quarterlySavingsPercent, type PlanPrice } from "./plans";

const prices: PlanPrice[] = [
  { plan: "pro", period: "month", amountCop: 19900, days: 30, aiDailyLimit: 20 },
  { plan: "pro", period: "quarter", amountCop: 49900, days: 90, aiDailyLimit: 20 },
];

describe("planes", () => {
  it("calcula el ahorro del trimestral", () => {
    expect(quarterlySavingsPercent(prices, "pro")).toBe(16);
    expect(quarterlySavingsPercent(prices, "basic")).toBeNull();
  });

  it("cuenta los días que quedan, sin negativos", () => {
    const now = new Date("2026-11-01T12:00:00Z");
    expect(daysLeft("2026-11-08T12:00:00Z", now)).toBe(7);
    expect(daysLeft("2026-10-01T00:00:00Z", now)).toBe(0);
    expect(daysLeft(null, now)).toBeNull();
  });
});
