export const RECIPE_CATEGORIES = ["breakfast", "soup", "main", "light", "side"] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  breakfast: "Desayuno",
  soup: "Sopa",
  main: "Plato fuerte",
  light: "Ligero",
  side: "Acompañamiento",
};
