import type { IngredientCategory } from "@/domain/categories";
import type { Quantity } from "@/domain/types";
import type { BaseUnit } from "@/domain/units";

export interface SeedIngredient {
  name: string;
  category: IngredientCategory;
  baseUnit: BaseUnit;
  gramsPerUnit: number | null;
  /** Precio de referencia aproximado (COP, 2026). En la app se muestra como editable, no como real. */
  price: { cop: number; per: Quantity };
}

const ingredient = (
  name: string,
  category: IngredientCategory,
  baseUnit: BaseUnit,
  gramsPerUnit: number | null,
  cop: number,
  per: Quantity,
): SeedIngredient => ({ name, category, baseUnit, gramsPerUnit, price: { cop, per } });

const kg = { amount: 1, unit: "kg" } as const;
const lb = { amount: 1, unit: "lb" } as const;
const each = { amount: 1, unit: "unit" } as const;

export const SEED_INGREDIENTS = {
  onion: ingredient("Cebolla cabezona", "vegetables", "unit", 150, 3500, kg),
  springOnion: ingredient("Cebolla larga", "vegetables", "g", 50, 4000, kg),
  tomato: ingredient("Tomate chonto", "vegetables", "g", 120, 4500, kg),
  garlic: ingredient("Ajo", "vegetables", "g", 5, 14000, kg),
  potato: ingredient("Papa pastusa", "vegetables", "g", 200, 3200, kg),
  creolePotato: ingredient("Papa criolla", "vegetables", "g", 30, 5000, kg),
  cassava: ingredient("Yuca", "vegetables", "g", 600, 3000, kg),
  greenPlantain: ingredient("Plátano verde", "vegetables", "unit", 300, 1500, each),
  ripePlantain: ingredient("Plátano maduro", "vegetables", "unit", 280, 1600, each),
  corn: ingredient("Mazorca", "vegetables", "unit", 250, 1500, each),
  carrot: ingredient("Zanahoria", "vegetables", "g", 100, 3000, kg),
  squash: ingredient("Ahuyama", "vegetables", "g", null, 2800, kg),
  greenBeans: ingredient("Habichuela", "vegetables", "g", null, 5000, kg),
  peas: ingredient("Arveja verde", "vegetables", "g", null, 9000, kg),
  bellPepper: ingredient("Pimentón", "vegetables", "unit", 180, 1500, each),
  cilantro: ingredient("Cilantro", "vegetables", "g", null, 8000, kg),
  guascas: ingredient("Guascas", "spices", "g", null, 30000, kg),
  avocado: ingredient("Aguacate", "vegetables", "unit", 400, 4000, each),
  lettuce: ingredient("Lechuga", "vegetables", "unit", 400, 2500, each),
  lime: ingredient("Limón", "fruits", "unit", 60, 400, each),
  chickenBreast: ingredient("Pechuga de pollo", "proteins", "g", null, 18000, kg),
  chickenPieces: ingredient("Pollo en presas", "proteins", "g", null, 13000, kg),
  hen: ingredient("Gallina en presas", "proteins", "g", null, 15000, kg),
  beefSteak: ingredient("Carne de res para bistec", "proteins", "g", null, 30000, kg),
  groundBeef: ingredient("Carne de res molida", "proteins", "g", null, 26000, kg),
  flankSteak: ingredient("Falda de res", "proteins", "g", null, 28000, kg),
  beefRibs: ingredient("Costilla de res", "proteins", "g", null, 22000, kg),
  tilapia: ingredient("Mojarra", "proteins", "unit", 400, 9000, each),
  bacon: ingredient("Tocineta", "proteins", "g", null, 32000, kg),
  ham: ingredient("Jamón", "proteins", "g", null, 24000, kg),
  egg: ingredient("Huevo", "dairy", "unit", null, 18000, { amount: 30, unit: "unit" }),
  milk: ingredient("Leche", "dairy", "ml", null, 4200, { amount: 1, unit: "l" }),
  farmerCheese: ingredient("Queso campesino", "dairy", "g", null, 20000, kg),
  slicedCheese: ingredient("Queso tajado", "dairy", "g", null, 28000, kg),
  cream: ingredient("Crema de leche", "dairy", "ml", null, 4500, { amount: 200, unit: "ml" }),
  butter: ingredient("Mantequilla", "dairy", "g", null, 6000, { amount: 125, unit: "g" }),
  rice: ingredient("Arroz", "grains", "g", null, 3000, lb),
  redBeans: ingredient("Fríjol cargamanto", "grains", "g", null, 7000, lb),
  lentils: ingredient("Lenteja", "grains", "g", null, 3500, lb),
  chickpeas: ingredient("Garbanzo", "grains", "g", null, 4500, lb),
  pasta: ingredient("Pasta", "grains", "g", null, 4500, { amount: 500, unit: "g" }),
  arepa: ingredient("Arepa blanca", "bakery", "unit", 80, 5000, { amount: 5, unit: "unit" }),
  slicedBread: ingredient("Pan tajado", "bakery", "unit", 25, 7000, { amount: 20, unit: "unit" }),
  bread: ingredient("Pan blanco", "bakery", "unit", 60, 600, each),
  oil: ingredient("Aceite vegetal", "pantry", "ml", null, 12000, { amount: 1, unit: "l" }),
  salt: ingredient("Sal", "pantry", "g", null, 2000, kg),
  chocolate: ingredient("Chocolate de mesa", "pantry", "g", 20, 12000, { amount: 500, unit: "g" }),
  stockCube: ingredient("Caldo en cubo", "pantry", "unit", null, 5000, { amount: 12, unit: "unit" }),
  cumin: ingredient("Comino molido", "spices", "g", null, 60000, kg),
  achiote: ingredient("Color (achiote)", "spices", "g", null, 40000, kg),
  pepper: ingredient("Pimienta", "spices", "g", null, 80000, kg),
} satisfies Record<string, SeedIngredient>;

export type SeedIngredientKey = keyof typeof SEED_INGREDIENTS;
