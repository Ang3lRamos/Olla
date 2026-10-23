import { describe, expect, it } from "vitest";
import { authForwarding, clientIpFrom } from "./forwarded-ip";

describe("authForwarding", () => {
  it("reenvía la IP solo con una llave secreta nueva", () => {
    expect(authForwarding("190.1.2.3", "sb_secret_abc")).toEqual({
      apiKey: "sb_secret_abc",
      headers: { "sb-forwarded-for": "190.1.2.3" },
    });
    // La service_role antigua (un JWT) no la acepta Supabase para esto.
    expect(authForwarding("190.1.2.3", "eyJhbGciOi")).toBeNull();
    expect(authForwarding(null, "sb_secret_abc")).toBeNull();
  });
});

describe("clientIpFrom", () => {
  it("toma la primera IP de la cadena", () => {
    expect(clientIpFrom("190.1.2.3, 10.0.0.1")).toBe("190.1.2.3");
    expect(clientIpFrom(null)).toBeNull();
  });
});
