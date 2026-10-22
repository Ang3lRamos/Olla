import { describe, expect, it } from "vitest";
import { ingredientPriceSchema, parsePriceCop } from "./schemas";

const RICE = "6b1d1a52-6d7e-4b44-9a3a-1f2f3c4d5e6f";

describe("parsePriceCop", () => {
  it.each([
    ["$ 3.500", 3500],
    ["12000", 12000],
    [4500, 4500],
    ["", Number.NaN],
  ])("%j -> %d", (raw, expected) => {
    expect(parsePriceCop(raw)).toBe(expected);
  });
});

describe("ingredientPriceSchema", () => {
  it("normaliza precio en pesos y cantidad con coma decimal", () => {
    expect(
      ingredientPriceSchema.parse({
        ingredientId: RICE,
        priceCop: "$ 3.200",
        perAmount: "0,5",
        perUnit: "kg",
      }),
    ).toEqual({
      ingredientId: RICE,
      priceCop: 3200,
      perAmount: 0.5,
      perUnit: "kg",
      packageLabel: null,
      pieces: null,
      pieceLabel: null,
    });
  });

  it("guarda la presentación con sus porciones", () => {
    expect(
      ingredientPriceSchema.parse({
        ingredientId: RICE,
        priceCop: "9.800",
        perAmount: "450",
        perUnit: "g",
        packageLabel: " paquete ",
        pieces: "18",
        pieceLabel: "tajadas",
      }),
    ).toMatchObject({ packageLabel: "paquete", pieces: 18, pieceLabel: "tajadas" });
  });

  it("sin cantidad de porciones descarta su nombre", () => {
    expect(
      ingredientPriceSchema.parse({
        ingredientId: RICE,
        priceCop: "1",
        perAmount: "1",
        perUnit: "g",
        pieceLabel: "tajadas",
      }),
    ).toMatchObject({ pieces: null, pieceLabel: null });
  });

  it.each([
    [{ priceCop: "" }, "Escribe el precio en pesos."],
    [{ perAmount: "0" }, "La cantidad debe ser mayor que cero."],
    [{ priceCop: "99.999.999" }, "Ese precio parece demasiado alto."],
    [{ pieces: "18" }, "Escribe cómo se llaman las porciones (p. ej. tajadas)."],
    [{ pieces: "2,5", pieceLabel: "tajadas" }, "Escribe cuántas porciones trae."],
  ])("rechaza %o", (override, message) => {
    const result = ingredientPriceSchema.safeParse({
      ingredientId: RICE,
      priceCop: "3000",
      perAmount: "1",
      perUnit: "lb",
      ...override,
    });
    expect(result.error?.issues[0]?.message).toBe(message);
  });
});
