import { describe, expect, it } from "vitest";
import { parseConfirmationRequest } from "./confirmation";
import { safeRedirectPath } from "./schemas";

const parse = (query: string) => parseConfirmationRequest(new URLSearchParams(query));

describe("parseConfirmationRequest", () => {
  it("reconoce el enlace con código", () => {
    expect(parse("code=abc123")).toEqual({ kind: "code", code: "abc123" });
  });

  it("reconoce el enlace con token_hash y tipo", () => {
    expect(parse("token_hash=xyz&type=signup")).toEqual({
      kind: "token-hash",
      tokenHash: "xyz",
      type: "signup",
    });
    expect(parse("token_hash=xyz&type=email")).toEqual({
      kind: "token-hash",
      tokenHash: "xyz",
      type: "email",
    });
  });

  it("rechaza tipos que esta ruta no maneja", () => {
    expect(parse("token_hash=xyz&type=recovery")).toBeNull();
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
