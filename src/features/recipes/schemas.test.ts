import { describe, expect, it } from "vitest";
import { flattenRecipeErrors, parseSteps, recipeFormSchema, type RecipeFormInput } from "./schemas";

const RICE = "6b1d1a52-6d7e-4b44-9a3a-1f2f3c4d5e6f";

const valid: RecipeFormInput = {
  id: null,
  name: " Arroz de la abuela ",
  category: "side",
  baseServings: 4,
  prepMinutes: "25",
  steps: "1. Lavar el arroz\n\n2) Sofreír\nCocinar tapado",
  ingredients: [{ ingredientId: RICE, quantity: "1,5", unit: "lb", note: "" }],
};

describe("parseSteps", () => {
  it("separa por líneas y quita numeración manual y vacíos", () => {
    expect(parseSteps("1. Lavar\n\n 2) Sofreír \n3- Servir\nProbar")).toEqual([
      "Lavar",
      "Sofreír",
      "Servir",
      "Probar",
    ]);
  });
});

describe("recipeFormSchema", () => {
  it("normaliza nombre, minutos, pasos y cantidades", () => {
    const parsed = recipeFormSchema.parse(valid);
    expect(parsed.name).toBe("Arroz de la abuela");
    expect(parsed.prepMinutes).toBe(25);
    expect(parsed.steps).toEqual(["Lavar el arroz", "Sofreír", "Cocinar tapado"]);
    expect(parsed.ingredients[0]?.quantity).toBe(1.5);
  });

  it("acepta minutos vacíos", () => {
    expect(recipeFormSchema.parse({ ...valid, prepMinutes: "" }).prepMinutes).toBeNull();
  });

  it("ubica cada error en su campo, incluida la fila del ingrediente", () => {
    const result = recipeFormSchema.safeParse({
      ...valid,
      name: "",
      steps: "  \n ",
      ingredients: [
        { ingredientId: RICE, quantity: "2", unit: "lb", note: "" },
        { ingredientId: RICE, quantity: "0", unit: "lb", note: "" },
      ],
    });
    expect(result.success).toBe(false);
    expect(flattenRecipeErrors(result.error!)).toEqual({
      name: "Ponle un nombre a la receta.",
      steps: "Agrega al menos un paso.",
      "ingredients.1.quantity": "La cantidad debe ser mayor que cero.",
    });
  });

  it("exige al menos un ingrediente", () => {
    const result = recipeFormSchema.safeParse({ ...valid, ingredients: [] });
    expect(flattenRecipeErrors(result.error!)).toEqual({ ingredients: "Agrega al menos un ingrediente." });
  });
});
