import { describe, expect, it } from "vitest";
import { householdFormSchema, householdPreferencesSchema, parseBudget, parseExclusions } from "./schemas";

describe("parseExclusions", () => {
  it("separa por comas y saltos de línea, limpia espacios y quita repetidos sin importar mayúsculas", () => {
    expect(parseExclusions(" cerdo,  maní\nMariscos, Cerdo ,, ")).toEqual(["cerdo", "maní", "Mariscos"]);
  });

  it("devuelve vacío si no hay nada", () => {
    expect(parseExclusions("  , \n ")).toEqual([]);
  });
});

describe("parseBudget", () => {
  it.each([
    ["200.000", 200000],
    ["$ 150000", 150000],
    ["", null],
    ["  ", null],
  ])("%j -> %j", (raw, expected) => {
    expect(parseBudget(raw)).toBe(expected);
  });
});

describe("householdFormSchema", () => {
  const valid = { name: " Casa Ramírez ", defaultPeople: "4", weeklyBudgetCop: "250.000", exclude: "cerdo" };

  it("normaliza los valores del formulario", () => {
    expect(householdFormSchema.parse(valid)).toEqual({
      name: "Casa Ramírez",
      defaultPeople: 4,
      weeklyBudgetCop: 250000,
      exclude: ["cerdo"],
    });
  });

  it.each([
    [{ name: "   " }, "name"],
    [{ defaultPeople: "0" }, "defaultPeople"],
    [{ defaultPeople: "21" }, "defaultPeople"],
    [{ defaultPeople: "2.5" }, "defaultPeople"],
    [{ weeklyBudgetCop: "999.999.999" }, "weeklyBudgetCop"],
    [{ exclude: Array.from({ length: 21 }, (_, i) => `cosa ${i}`).join(",") }, "exclude"],
  ])("rechaza %o en %s", (override, field) => {
    const result = householdFormSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe(field);
  });
});

describe("householdPreferencesSchema", () => {
  it("tolera preferencias vacías o mal formadas guardadas en la base", () => {
    expect(householdPreferencesSchema.parse({})).toEqual({ exclude: [] });
    expect(householdPreferencesSchema.parse({ exclude: "cerdo" })).toEqual({ exclude: [] });
  });
});
