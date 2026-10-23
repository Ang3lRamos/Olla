import type { NutritionTotals } from "./nutrition";

export type NutrientKey = keyof NutritionTotals;

/** "Al menos" (proteína, fibra) o "máximo" (azúcares): lo decide la persona, no Olla. */
export type GoalDirection = "min" | "max";

export interface NutritionGoal {
  nutrient: NutrientKey;
  target: number;
  direction: GoalDirection;
}

export interface GoalProgress extends NutritionGoal {
  value: number;
  /** Lo logrado frente a la meta (0.5 = la mitad); sirve para barras y porcentajes. */
  ratio: number;
  met: boolean;
}

export const NUTRIENT_KEYS: NutrientKey[] = ["kcal", "protein", "carbs", "sugar", "fat", "fiber"];

export const NUTRIENT_LABELS: Record<NutrientKey, { name: string; unit: string; short: string }> = {
  kcal: { name: "Calorías", unit: "kcal", short: "kcal" },
  protein: { name: "Proteína", unit: "g", short: "Prot." },
  carbs: { name: "Carbohidratos", unit: "g", short: "Carb." },
  sugar: { name: "Azúcares", unit: "g", short: "Azúc." },
  fat: { name: "Grasa", unit: "g", short: "Grasa" },
  fiber: { name: "Fibra", unit: "g", short: "Fibra" },
};

/** Lo que se sugiere al crear una meta; la persona lo cambia si quiere. */
export const DEFAULT_DIRECTIONS: Record<NutrientKey, GoalDirection> = {
  kcal: "max",
  protein: "min",
  carbs: "max",
  sugar: "max",
  fat: "max",
  fiber: "min",
};

/** Cómo va un día (o una porción) frente a cada meta, en el orden fijo de los nutrientes. */
export function goalProgress(totals: NutritionTotals, goals: NutritionGoal[]): GoalProgress[] {
  return NUTRIENT_KEYS.flatMap((nutrient) => {
    const goal = goals.find((item) => item.nutrient === nutrient);
    if (!goal || goal.target <= 0) return [];
    const value = totals[nutrient];
    return [
      {
        ...goal,
        value,
        ratio: value / goal.target,
        met: goal.direction === "min" ? value >= goal.target : value <= goal.target,
      },
    ];
  });
}
