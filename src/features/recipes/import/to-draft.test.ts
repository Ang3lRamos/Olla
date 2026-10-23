import { describe, expect, it } from "vitest";
import type { Ingredient } from "@/domain/types";
import { toImportedRecipe } from "./to-draft";

const catalog: Ingredient[] = [
  { id: "papa", name: "Papa pastusa", category: "vegetables", baseUnit: "g", gramsPerUnit: 200 },
  { id: "arroz", name: "Arroz", category: "grains", baseUnit: "g", gramsPerUnit: null },
];

describe("toImportedRecipe", () => {
  it("liga lo que existe, ajusta unidades y deja lo nuevo para crear", () => {
    const draft = toImportedRecipe(
      {
        name: "Arroz con papa",
        servings: 6,
        prepMinutes: 40,
        ingredients: [
          { name: "arroz", quantity: 2, unit: "tazas", note: null },
          { name: "papas pastusas", quantity: 1.5, unit: "libras", note: "en cubos" },
          { name: "comino entero", quantity: null, unit: null, note: null },
        ],
        steps: ["Sofríe.", "Cocina 20 minutos."],
      },
      catalog,
    );
    expect(draft).toMatchObject({
      name: "Arroz con papa",
      servings: 6,
      prepMinutes: 40,
      steps: "Sofríe.\nCocina 20 minutos.",
    });
    expect(draft.lines).toEqual([
      // "tazas" no aplica al arroz (se mide por peso): no se inventa la conversión.
      { ingredientId: "arroz", quantity: "", unit: "g", note: "2 tazas en la receta", unmatchedName: null },
      { ingredientId: "papa", quantity: "1,5", unit: "lb", note: "en cubos", unmatchedName: null },
      { ingredientId: "", quantity: "", unit: "unit", note: "", unmatchedName: "Comino entero" },
    ]);
  });
});
