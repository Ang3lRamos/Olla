/** En el orden en que suele recorrerse una plaza o un supermercado. */
export const INGREDIENT_CATEGORIES = [
  "vegetables",
  "fruits",
  "proteins",
  "dairy",
  "grains",
  "bakery",
  "pantry",
  "spices",
  "beverages",
  "cleaning",
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  vegetables: "Verduras",
  fruits: "Frutas",
  proteins: "Proteínas",
  dairy: "Lácteos y huevos",
  grains: "Granos",
  bakery: "Panadería",
  pantry: "Despensa",
  spices: "Condimentos",
  beverages: "Bebidas",
  cleaning: "Aseo",
};
