import { describe, expect, it } from "vitest";
import { refundNoticeEmail } from "./refund-notice";

describe("refundNoticeEmail", () => {
  it("va a soporte con lo necesario para resolverlo", () => {
    const email = refundNoticeEmail({
      supportEmail: "soporte@example.com",
      customerEmail: "ana@example.com",
      amountCop: 19_900,
      reference: "olla-123",
      deadline: "2026-10-26",
      adminUrl: "https://olla.example/admin",
    });
    expect(email.to).toBe("soporte@example.com");
    expect(email.subject).toContain("ana@example.com");
    expect(email.text).toContain("olla-123");
    expect(email.text).toContain("https://olla.example/admin");
  });
});
