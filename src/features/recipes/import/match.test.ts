import { describe, expect, it } from "vitest";
import type { Ingredient } from "@/domain/types";
import { fitUnit, matchIngredient, toUnit } from "./match";

const ingredient = (
  id: string,
  name: string,
  baseUnit: Ingredient["baseUnit"],
  gramsPerUnit: number | null = null,
) => ({ id, name, category: "vegetables", baseUnit, gramsPerUnit }) satisfies Ingredient;

const catalog = [
  ingredient("papa", "Papa pastusa", "g", 200),
  ingredient("criolla", "Papa criolla", "g", 30),
  ingredient("cebolla", "Cebolla cabezona", "unit", 150),
  ingredient("ajo", "Ajo", "g", 5),
  ingredient("leche", "Leche", "ml"),
  ingredient("arroz", "Arroz", "g"),
  ingredient("tomate", "Tomate chonto", "g", 120),
  ingredient("limon", "Limón", "unit", 60),
];

describe("toUnit", () => {
  it.each([
    ["gramos", "g"],
    ["gr.", "g"],
    ["Libras", "lb"],
    ["tazas", "cup"],
    ["cdas", "tbsp"],
    ["litro", "l"],
    ["dientes", "unit"],
    [null, "unit"],
  ])("%j -> %s", (word, unit) => {
    expect(toUnit(word)).toBe(unit);
  });
});

describe("matchIngredient", () => {
  it("encuentra el ingrediente aunque cambien tildes, plurales y palabras de más", () => {
    expect(matchIngredient("papas pastusas grandes", catalog)?.id).toBe("papa");
    expect(matchIngredient("Papa criolla", catalog)?.id).toBe("criolla");
    expect(matchIngredient("dientes de ajo", catalog)?.id).toBe("ajo");
    expect(matchIngredient("ARROZ", catalog)?.id).toBe("arroz");
    expect(matchIngredient("tomates chontos maduros", catalog)?.id).toBe("tomate");
    expect(matchIngredient("2 limones", catalog)?.id).toBe("limon");
  });

  it("no inventa coincidencias", () => {
    expect(matchIngredient("comino", catalog)).toBeNull();
    expect(matchIngredient("papa", catalog)).toBeNull();
    expect(matchIngredient("", catalog)).toBeNull();
  });
});

describe("fitUnit", () => {
  it("cambia una unidad que no aplica por la natural del ingrediente", () => {
    expect(fitUnit("cup", catalog[5]!)).toBe("g");
    expect(fitUnit("unit", catalog[2]!)).toBe("unit");
    expect(fitUnit("l", catalog[4]!)).toBe("l");
    expect(fitUnit("tbsp", null)).toBe("tbsp");
  });
});
