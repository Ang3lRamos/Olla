import type { AssistantContext, CatalogRecipe } from "./context";

const recipe = (
  id: string,
  name: string,
  category: CatalogRecipe["category"],
  costPerServingCop: number,
  ingredientNames: string[],
): CatalogRecipe => ({ id, name, category, prepMinutes: 30, costPerServingCop, ingredientNames });

export const RECIPES: CatalogRecipe[] = [
  recipe("sudado", "Sudado de pollo", "main", 4000, ["Pollo en presas", "Papa pastusa"]),
  recipe("mojarra", "Mojarra frita", "main", 5500, ["Mojarra", "Limón"]),
  recipe("lentejas", "Lentejas guisadas", "main", 2000, ["Lenteja", "Papa pastusa"]),
  recipe("frijoles", "Fríjoles con plátano", "main", 2500, ["Fríjol cargamanto", "Tocineta"]),
  recipe("ajiaco", "Ajiaco", "soup", 5200, ["Pechuga de pollo", "Papa criolla"]),
  recipe("pericos", "Huevos pericos", "breakfast", 1100, ["Huevo", "Tomate chonto"]),
  recipe("calentado", "Calentado", "breakfast", 1500, ["Arroz", "Fríjol cargamanto", "Huevo"]),
  recipe("changua", "Changua", "breakfast", 1300, ["Leche", "Huevo"]),
  recipe("arepa", "Arepa con queso", "light", 1200, ["Arepa blanca", "Queso campesino"]),
  recipe("sopa", "Sopa de verduras", "soup", 1400, ["Papa pastusa", "Zanahoria"]),
];

export function makeContext(overrides: Partial<AssistantContext> = {}): AssistantContext {
  return {
    mode: "propose",
    instruction: "",
    onlyEmpty: true,
    people: 4,
    weeklyBudgetCop: 200000,
    currentMarketCop: 0,
    exclude: ["tocineta"],
    slots: [],
    recipes: RECIPES,
    pantry: ["Arroz"],
    marketExtras: [],
    focus: [],
    notes: [],
    ...overrides,
  };
}
