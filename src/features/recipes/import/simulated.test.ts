import { describe, expect, it } from "vitest";
import { simulateRecipeImport } from "./simulated";

describe("simulateRecipeImport", () => {
  it("separa nombre, ingredientes con cantidad y pasos", () => {
    const recipe = simulateRecipeImport(`Arroz con pollo
Ingredientes:
2 tazas de arroz
1 libra de pechuga de pollo
3 dientes de ajo
Preparación:
1. Sofríe el ajo.
2. Agrega el arroz y el pollo.`);
    expect(recipe.name).toBe("Arroz con pollo");
    expect(recipe.ingredients).toEqual([
      { name: "arroz", quantity: 2, unit: "tazas", note: null },
      { name: "pechuga de pollo", quantity: 1, unit: "libra", note: null },
      { name: "ajo", quantity: 3, unit: "dientes", note: null },
    ]);
    expect(recipe.steps).toEqual(["Sofríe el ajo.", "Agrega el arroz y el pollo."]);
  });
});
