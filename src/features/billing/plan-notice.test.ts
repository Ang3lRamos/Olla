import { describe, expect, it } from "vitest";
import { planNotice, type Entitlement } from "./plan-notice";

const now = new Date("2026-11-10T12:00:00Z");
const pro = (expiresAt: string | null, isTrial = false): Entitlement => ({ plan: "pro", expiresAt, isTrial });

describe("planNotice", () => {
  it("avisa en los últimos 5 días, y no antes", () => {
    expect(planNotice(pro("2026-11-13T12:00:00Z"), now)).toEqual({
      kind: "ending",
      plan: "pro",
      days: 3,
      trial: false,
    });
    expect(planNotice(pro("2026-11-20T12:00:00Z"), now)).toBeNull();
  });

  it("distingue la prueba gratis", () => {
    expect(planNotice(pro("2026-11-11T12:00:00Z", true), now)).toMatchObject({ kind: "ending", trial: true });
  });

  it("recuerda una semana que el plan venció", () => {
    expect(planNotice(pro("2026-11-08T12:00:00Z"), now)).toMatchObject({ kind: "ended", plan: "pro" });
    expect(planNotice(pro("2026-10-20T12:00:00Z"), now)).toBeNull();
  });

  it("no dice nada sin plan pago o con un plan que no vence", () => {
    expect(planNotice(null, now)).toBeNull();
    expect(planNotice({ plan: "free", expiresAt: null, isTrial: false }, now)).toBeNull();
    expect(planNotice(pro(null), now)).toBeNull();
  });
});
