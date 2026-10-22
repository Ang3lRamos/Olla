import { describe, expect, it } from "vitest";
import { parseConfirmationRequest } from "./confirmation";
import { newPasswordSchema, safeRedirectPath } from "./schemas";

const parse = (query: string) => parseConfirmationRequest(new URLSearchParams(query));

describe("parseConfirmationRequest", () => {
  it("reconoce el enlace con código", () => {
    expect(parse("code=abc123")).toEqual({ kind: "code", code: "abc123", recovery: false });
  });

  it("sabe cuándo el enlace era para cambiar la contraseña", () => {
    expect(parse("code=abc123&siguiente=/nueva-contrasena")).toMatchObject({ recovery: true });
    expect(parse("token_hash=xyz&type=recovery")).toEqual({
      kind: "token-hash",
      tokenHash: "xyz",
      type: "recovery",
      recovery: true,
    });
    expect(parse("code=abc123&siguiente=https://otro.com")).toMatchObject({ recovery: false });
  });

  it("reconoce el enlace con token_hash y tipo", () => {
    expect(parse("token_hash=xyz&type=signup")).toEqual({
      kind: "token-hash",
      tokenHash: "xyz",
      type: "signup",
      recovery: false,
    });
    expect(parse("token_hash=xyz&type=email")).toEqual({
      kind: "token-hash",
      tokenHash: "xyz",
      type: "email",
      recovery: false,
    });
  });

  it("rechaza tipos que esta ruta no maneja", () => {
    expect(parse("token_hash=xyz&type=otro")).toBeNull();
  });

  it("rechaza enlaces incompletos", () => {
    expect(parse("")).toBeNull();
    expect(parse("token_hash=xyz")).toBeNull();
    expect(parse("type=signup")).toBeNull();
    expect(parse("code=")).toBeNull();
  });
});

describe("safeRedirectPath", () => {
  it.each([
    ["/ajustes", "/ajustes"],
    ["/recetas?categoria=sopa", "/recetas?categoria=sopa"],
    ["//evil.com", "/"],
    ["https://evil.com", "/"],
    ["ajustes", "/"],
    [null, "/"],
  ])("%j -> %j", (value, expected) => {
    expect(safeRedirectPath(value)).toBe(expected);
  });
});

describe("newPasswordSchema", () => {
  it("pide la misma contraseña dos veces y con el largo mínimo", () => {
    expect(newPasswordSchema.safeParse({ password: "nueva-clave-1", confirm: "nueva-clave-1" }).success).toBe(
      true,
    );
    expect(
      newPasswordSchema.safeParse({ password: "nueva-clave-1", confirm: "otra" }).error?.issues[0]?.path,
    ).toEqual(["confirm"]);
    expect(newPasswordSchema.safeParse({ password: "corta", confirm: "corta" }).success).toBe(false);
  });
});
