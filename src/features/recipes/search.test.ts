import { describe, expect, it } from "vitest";
import { matchesQuery, normalizeForSearch } from "./search";

describe("normalizeForSearch", () => {
  it("quita tildes y mayúsculas", () => {
    expect(normalizeForSearch("  Fríjoles con Plátano ")).toBe("frijoles con platano");
    expect(normalizeForSearch("Ñame")).toBe("name");
  });
});

describe("matchesQuery", () => {
  const sudado = normalizeForSearch("Sudado de pollo Pollo en presas Papa pastusa Tomate chonto");

  it("encuentra por nombre o por ingrediente, sin importar tildes ni orden", () => {
    expect(matchesQuery(sudado, "pollo")).toBe(true);
    expect(matchesQuery(sudado, "papa SUDADO")).toBe(true);
    expect(matchesQuery(sudado, "tomáte")).toBe(true);
  });

  it("exige que todas las palabras aparezcan", () => {
    expect(matchesQuery(sudado, "pollo arroz")).toBe(false);
  });

  it("una búsqueda vacía coincide con todo", () => {
    expect(matchesQuery(sudado, "   ")).toBe(true);
  });
});
