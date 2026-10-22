import { describe, expect, it } from "vitest";
import { selectCandidates } from "./candidates";
import { isExcluded, sanitizeProposal } from "./sanitize";
import { makeContext, RECIPES } from "./test-context";

const proposal = (
  changes: Array<{ day: number; meal: "breakfast" | "lunch" | "dinner"; recipeId: string | null }>,
) => ({
  summary: "Propuesta",
  changes,
});

describe("isExcluded", () => {
  it("detecta exclusiones en el nombre o los ingredientes, sin tildes ni mayúsculas", () => {
    const frijoles = RECIPES.find((recipe) => recipe.id === "frijoles")!;
    expect(isExcluded(frijoles, ["TOCINETA"])).toBe(true);
    expect(isExcluded(frijoles, ["frijol"])).toBe(true);
    expect(isExcluded(frijoles, ["pescado", " "])).toBe(false);
  });
});

describe("sanitizeProposal", () => {
  it("descarta ids inventados y recetas con algo de «no incluir»", () => {
    const result = sanitizeProposal(
      proposal([
        { day: 0, meal: "lunch", recipeId: "inventada" },
        { day: 1, meal: "lunch", recipeId: "frijoles" },
        { day: 2, meal: "lunch", recipeId: "lentejas" },
      ]),
      makeContext(),
    );
    expect(result.changes.map((change) => change.recipeId)).toEqual(["lentejas"]);
    expect(result.discarded.map((item) => item.reason)).toEqual(["unknown-recipe", "excluded"]);
  });

  it("con «solo vacías» no toca casillas ocupadas ni permite vaciarlas", () => {
    const context = makeContext({
      slots: [{ day: 0, meal: "lunch", recipeId: "sudado", peopleOverride: null }],
    });
    const result = sanitizeProposal(
      proposal([
        { day: 0, meal: "lunch", recipeId: "lentejas" },
        { day: 1, meal: "lunch", recipeId: null },
      ]),
      context,
    );
    expect(result.changes).toEqual([]);
    expect(result.discarded.map((item) => item.reason)).toEqual(["occupied-slot", "clear-not-allowed"]);
  });

  it("al ajustar permite vaciar casillas ocupadas, ignora las que no cambian y deja la última propuesta por casilla", () => {
    const context = makeContext({
      mode: "adjust",
      slots: [
        { day: 0, meal: "lunch", recipeId: "sudado", peopleOverride: null },
        { day: 1, meal: "lunch", recipeId: "mojarra", peopleOverride: null },
      ],
    });
    const result = sanitizeProposal(
      proposal([
        { day: 0, meal: "lunch", recipeId: "sudado" },
        { day: 1, meal: "lunch", recipeId: "ajiaco" },
        { day: 1, meal: "lunch", recipeId: "lentejas" },
        { day: 3, meal: "dinner", recipeId: null },
      ]),
      context,
    );
    expect(result.changes).toEqual([{ day: 1, meal: "lunch", recipeId: "lentejas", reason: null }]);
  });

  it("ordena los cambios por día y comida", () => {
    const result = sanitizeProposal(
      proposal([
        { day: 2, meal: "dinner", recipeId: "arepa" },
        { day: 0, meal: "lunch", recipeId: "sudado" },
        { day: 0, meal: "breakfast", recipeId: "pericos" },
      ]),
      makeContext(),
    );
    expect(result.changes.map((change) => `${change.day}-${change.meal}`)).toEqual([
      "0-breakfast",
      "0-lunch",
      "2-dinner",
    ]);
  });
});

describe("selectCandidates", () => {
  const base = {
    recipes: RECIPES,
    exclude: ["tocineta"],
    inWeek: new Set<string>(),
    pantryNames: new Set<string>(),
  };

  it("quita lo prohibido salvo que ya esté en la semana", () => {
    expect(selectCandidates(base).some((recipe) => recipe.id === "frijoles")).toBe(false);
    expect(
      selectCandidates({ ...base, inWeek: new Set(["frijoles"]) }).some((recipe) => recipe.id === "frijoles"),
    ).toBe(true);
  });

  it("con catálogo grande prioriza lo de la semana, lo que usa la despensa y lo económico", () => {
    const top = selectCandidates({
      ...base,
      inWeek: new Set(["ajiaco"]),
      pantryNames: new Set(["Lenteja"]),
      limit: 3,
    });
    expect(top.map((recipe) => recipe.id)).toEqual(["ajiaco", "lentejas", "pericos"]);
  });
});
