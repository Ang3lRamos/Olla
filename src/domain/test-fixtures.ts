import { buildCatalog } from "./catalog";
import type { Ingredient, Recipe } from "./types";

export const rice: Ingredient = {
  id: "rice",
  name: "Arroz",
  category: "grains",
  baseUnit: "g",
  gramsPerUnit: null,
};
export const onion: Ingredient = {
  id: "onion",
  name: "Cebolla cabezona",
  category: "vegetables",
  baseUnit: "unit",
  gramsPerUnit: 150,
};
export const tomato: Ingredient = {
  id: "tomato",
  name: "Tomate",
  category: "vegetables",
  baseUnit: "g",
  gramsPerUnit: 120,
};
export const egg: Ingredient = {
  id: "egg",
  name: "Huevo",
  category: "dairy",
  baseUnit: "unit",
  gramsPerUnit: null,
};
export const oil: Ingredient = {
  id: "oil",
  name: "Aceite",
  category: "pantry",
  baseUnit: "ml",
  gramsPerUnit: null,
};
export const chicken: Ingredient = {
  id: "chicken",
  name: "Pollo",
  category: "proteins",
  baseUnit: "g",
  gramsPerUnit: null,
};

export const catalog = buildCatalog([rice, onion, tomato, egg, oil, chicken]);

export const arrozBlanco: Recipe = {
  id: "arroz-blanco",
  name: "Arroz blanco",
  baseServings: 4,
  ingredients: [
    { ingredientId: "rice", quantity: { amount: 1, unit: "lb" } },
    { ingredientId: "oil", quantity: { amount: 2, unit: "tbsp" } },
    { ingredientId: "onion", quantity: { amount: 0.5, unit: "unit" } },
  ],
};

export const sudadoDePollo: Recipe = {
  id: "sudado-de-pollo",
  name: "Sudado de pollo",
  baseServings: 4,
  ingredients: [
    { ingredientId: "chicken", quantity: { amount: 1, unit: "kg" } },
    { ingredientId: "tomato", quantity: { amount: 3, unit: "unit" } },
    { ingredientId: "onion", quantity: { amount: 1, unit: "unit" } },
    { ingredientId: "oil", quantity: { amount: 3, unit: "tbsp" } },
  ],
};

export const huevosPericos: Recipe = {
  id: "huevos-pericos",
  name: "Huevos pericos",
  baseServings: 2,
  ingredients: [
    { ingredientId: "egg", quantity: { amount: 4, unit: "unit" } },
    { ingredientId: "tomato", quantity: { amount: 100, unit: "g" } },
    { ingredientId: "onion", quantity: { amount: 75, unit: "g" } },
  ],
};
