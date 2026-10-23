import type { Nutrients } from "@/domain/types";
import type { SEED_INGREDIENTS } from "./ingredients";

/**
 * Nutrientes de referencia del catálogo de base, aproximados a partir de tablas de
 * composición (ICBF y USDA), en porción comestible y crudo salvo que se diga otra cosa.
 * Son valores típicos para estimar, no mediciones: se muestran siempre como aproximados.
 * Por 100 g, por 100 ml (líquidos) o por unidad (huevo, cubo de caldo).
 */
const per100g = (
  kcal: number,
  protein: number,
  carbs: number,
  sugar: number,
  fat: number,
  fiber: number,
): Nutrients => ({
  basis: "100g",
  kcal,
  protein,
  carbs,
  sugar,
  fat,
  fiber,
});
const per100ml = (...values: Parameters<typeof per100g>): Nutrients => ({
  ...per100g(...values),
  basis: "100ml",
});
const perUnit = (...values: Parameters<typeof per100g>): Nutrients => ({
  ...per100g(...values),
  basis: "unit",
});

export const SEED_NUTRIENTS: Record<keyof typeof SEED_INGREDIENTS, Nutrients> = {
  onion: per100g(40, 1.1, 9.3, 4.2, 0.1, 1.7),
  springOnion: per100g(32, 1.8, 7.3, 2.3, 0.2, 2.6),
  tomato: per100g(18, 0.9, 3.9, 2.6, 0.2, 1.2),
  garlic: per100g(149, 6.4, 33, 1, 0.5, 2.1),
  potato: per100g(77, 2, 17, 0.8, 0.1, 2.2),
  creolePotato: per100g(80, 2.1, 18, 0.8, 0.1, 1.8),
  cassava: per100g(160, 1.4, 38, 1.7, 0.3, 1.8),
  greenPlantain: per100g(122, 1.3, 32, 7, 0.4, 2.3),
  ripePlantain: per100g(122, 1.3, 32, 15, 0.4, 2.3),
  corn: per100g(86, 3.3, 19, 3.2, 1.4, 2.7),
  carrot: per100g(41, 0.9, 10, 4.7, 0.2, 2.8),
  squash: per100g(26, 1, 6.5, 2.8, 0.1, 0.5),
  greenBeans: per100g(31, 1.8, 7, 3.3, 0.2, 2.7),
  peas: per100g(81, 5.4, 14.5, 5.7, 0.4, 5.1),
  bellPepper: per100g(31, 1, 6, 4.2, 0.3, 2.1),
  cilantro: per100g(23, 2.1, 3.7, 0.9, 0.5, 2.8),
  guascas: per100g(30, 3, 5, 0.5, 0.4, 3),
  avocado: per100g(160, 2, 8.5, 0.7, 14.7, 6.7),
  lettuce: per100g(15, 1.4, 2.9, 0.8, 0.2, 1.3),
  lime: per100g(29, 1.1, 9.3, 2.5, 0.3, 2.8),
  chickenBreast: per100g(120, 22.5, 0, 0, 2.6, 0),
  chickenPieces: per100g(215, 18.6, 0, 0, 15, 0),
  hen: per100g(230, 18, 0, 0, 17, 0),
  beefSteak: per100g(150, 21, 0, 0, 7, 0),
  groundBeef: per100g(215, 18.6, 0, 0, 15, 0),
  flankSteak: per100g(190, 20, 0, 0, 12, 0),
  beefRibs: per100g(290, 16, 0, 0, 25, 0),
  tilapia: per100g(96, 20, 0, 0, 1.7, 0),
  bacon: per100g(420, 12, 1.3, 0, 41, 0),
  ham: per100g(145, 21, 1.5, 1.2, 6, 0),
  egg: perUnit(72, 6.3, 0.4, 0.2, 4.8, 0),
  milk: per100ml(61, 3.2, 4.8, 5, 3.3, 0),
  farmerCheese: per100g(264, 18, 3, 3, 20, 0),
  slicedCheese: per100g(300, 22, 2.5, 1, 22, 0),
  cream: per100ml(340, 2.1, 2.8, 2.9, 36, 0),
  butter: per100g(717, 0.9, 0.1, 0.1, 81, 0),
  rice: per100g(360, 6.7, 79, 0.1, 0.6, 1.3),
  redBeans: per100g(333, 23, 60, 2, 0.8, 15),
  lentils: per100g(352, 24.6, 63, 2, 1.1, 10.7),
  chickpeas: per100g(364, 19, 61, 10.7, 6, 17),
  pasta: per100g(371, 13, 75, 2.7, 1.5, 3.2),
  arepa: per100g(220, 4.5, 45, 0.5, 2, 2.5),
  slicedBread: per100g(265, 9, 49, 5, 3.2, 2.7),
  bread: per100g(275, 8.5, 52, 6, 3.5, 2.4),
  oil: per100ml(813, 0, 0, 0, 92, 0),
  salt: per100g(0, 0, 0, 0, 0, 0),
  chocolate: per100g(450, 5, 68, 58, 18, 6),
  stockCube: perUnit(25, 1, 2, 0.5, 1.5, 0),
  cumin: per100g(375, 18, 44, 2.3, 22, 10.5),
  achiote: per100g(260, 4, 45, 2, 6, 15),
  pepper: per100g(251, 10, 64, 0.6, 3.3, 25),
};
