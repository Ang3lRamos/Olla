import { describe, expect, it } from "vitest";
import { canPropose, FREE_QUOTA } from "./quota";

describe("canPropose", () => {
  it("con plan pago, mientras queden consultas del día", () => {
    const pro = { ...FREE_QUOTA, plan: "pro" as const, dailyLimit: 20 };
    expect(canPropose({ ...pro, used: 19 })).toBe(true);
    expect(canPropose({ ...pro, used: 20 })).toBe(false);
    expect(canPropose({ ...pro, dailyLimit: null, used: 99 })).toBe(true);
  });

  it("en Gratis, solo si le queda el menú de la semana", () => {
    expect(canPropose({ ...FREE_QUOTA, freeMenuAvailable: true })).toBe(true);
    expect(canPropose(FREE_QUOTA)).toBe(false);
  });
});
