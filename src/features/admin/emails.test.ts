import { describe, expect, it } from "vitest";
import { isAdminEmail } from "./emails";

describe("isAdminEmail", () => {
  it("compara sin mayúsculas ni espacios", () => {
    expect(isAdminEmail("Yo@Ejemplo.com", " otro@ejemplo.com , yo@ejemplo.com ")).toBe(true);
    expect(isAdminEmail("intruso@ejemplo.com", "yo@ejemplo.com")).toBe(false);
  });

  it("sin la variable nadie entra", () => {
    expect(isAdminEmail("yo@ejemplo.com", undefined)).toBe(false);
    expect(isAdminEmail("yo@ejemplo.com", "")).toBe(false);
    expect(isAdminEmail(null, "yo@ejemplo.com")).toBe(false);
  });
});
