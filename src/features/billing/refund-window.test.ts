import { describe, expect, it } from "vitest";
import { refundWindow } from "./refund-window";

describe("refundWindow", () => {
  // Pago el lunes 19 de octubre de 2026 a las 8 p. m., hora de Colombia.
  const paidAt = "2026-10-20T01:00:00Z";

  it("cuenta desde el día del pago en Colombia y cierra al terminar el quinto día hábil", () => {
    expect(refundWindow(paidAt, new Date("2026-10-27T04:59:00Z"))).toEqual({
      deadline: "2026-10-26",
      open: true,
    });
    expect(refundWindow(paidAt, new Date("2026-10-27T05:00:00Z")).open).toBe(false);
  });
});
