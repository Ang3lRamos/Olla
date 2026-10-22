import { MAIN_AND_SIDE_RECIPES } from "./recipes-main";
import { BREAKFAST_SOUP_AND_LIGHT_RECIPES } from "./recipes-light";

export { SEED_INGREDIENTS, type SeedIngredient, type SeedIngredientKey } from "./ingredients";
export type { SeedRecipe } from "./recipe-types";

export const SEED_RECIPES = [...BREAKFAST_SOUP_AND_LIGHT_RECIPES, ...MAIN_AND_SIDE_RECIPES];
