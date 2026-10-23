import { describe, expect, it } from "vitest";
import { goalProgress } from "./nutrition-goals";

const day = { kcal: 2100, protein: 90, carbs: 250, sugar: 60, fat: 70, fiber: 20 };

describe("goalProgress", () => {
  it("compara cada nutriente según lo que la persona eligió", () => {
    const progress = goalProgress(day, [
      { nutrient: "sugar", target: 50, direction: "max" },
      { nutrient: "protein", target: 120, direction: "min" },
      { nutrient: "kcal", target: 2200, direction: "max" },
    ]);
    // En el orden fijo de los nutrientes, no en el orden en que se guardaron.
    expect(progress.map((item) => [item.nutrient, item.met])).toEqual([
      ["kcal", true],
      ["protein", false],
      ["sugar", false],
    ]);
    expect(progress[1]!.ratio).toBeCloseTo(0.75);
  });

  it("ignora metas vacías o en cero", () => {
    expect(goalProgress(day, [{ nutrient: "fiber", target: 0, direction: "min" }])).toEqual([]);
    expect(goalProgress(day, [])).toEqual([]);
  });
});
