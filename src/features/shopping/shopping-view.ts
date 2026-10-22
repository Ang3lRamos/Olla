import { CATEGORY_LABELS, INGREDIENT_CATEGORIES, type IngredientCategory } from "@/domain/categories";
import { getIngredient, type IngredientCatalog } from "@/domain/catalog";
import { quantityCost, type PriceList } from "@/domain/costs";
import { buildShoppingLines } from "@/domain/shopping-list";
import { reconcilePurchases, type Purchase, type ShoppingItem } from "@/domain/shopping-status";
import type { BaseQuantity, PantryItem, Recipe } from "@/domain/types";
import { toPlannedMeals, type PlannedSlot } from "@/domain/week-plan";
import type { ShoppingExtra } from "./data";

export interface PricedItem {
  item: ShoppingItem;
  /** Costo de toda la línea del menú; null si no tiene precio. */
  costCop: number | null;
}

export interface ShoppingGroupView {
  category: IngredientCategory;
  label: string;
  items: PricedItem[];
  extras: ShoppingExtra[];
}

export interface ShoppingView {
  plannedMeals: number;
  groups: ShoppingGroupView[];
  /** Lo que no hay que comprar porque ya está en la despensa. */
  inPantry: ShoppingItem[];
  totals: {
    marketCop: number;
    pendingCop: number;
    unpricedCount: number;
    done: number;
    total: number;
  };
}

interface BuildShoppingViewInput {
  slots: PlannedSlot[];
  recipes: ReadonlyMap<string, Recipe>;
  people: number;
  pantry: PantryItem[];
  purchases: Purchase[];
  extras: ShoppingExtra[];
  catalog: IngredientCatalog;
  prices: PriceList;
}

export function buildShoppingView(input: BuildShoppingViewInput): ShoppingView {
  const { slots, recipes, people, pantry, purchases, extras, catalog, prices } = input;
  const meals = toPlannedMeals(slots, recipes, people);
  const items = reconcilePurchases(buildShoppingLines(meals, pantry, catalog), purchases);
  const toBuy = items.filter((item) => item.status !== "in-pantry");

  const cost = (ingredientId: string, quantity: BaseQuantity) =>
    quantity.amount === 0
      ? 0
      : quantityCost(quantity, getIngredient(catalog, ingredientId), prices.get(ingredientId));
  const priced = toBuy.map((item) => ({ item, costCop: cost(item.ingredientId, item.toBuy) }));
  const sum = (values: Array<number | null>) =>
    Math.round(values.reduce<number>((total, value) => total + (value ?? 0), 0));

  const byName = (a: PricedItem, b: PricedItem) => a.item.name.localeCompare(b.item.name, "es");
  const groups = INGREDIENT_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: priced.filter(({ item }) => item.category === category).sort(byName),
    extras: extras.filter((extra) => extra.category === category),
  })).filter((group) => group.items.length > 0 || group.extras.length > 0);

  return {
    plannedMeals: meals.length,
    groups,
    inPantry: items.filter((item) => item.status === "in-pantry"),
    totals: {
      marketCop: sum(priced.map(({ costCop }) => costCop)),
      pendingCop: sum(toBuy.map((item) => cost(item.ingredientId, item.remaining))),
      unpricedCount: priced.filter(({ costCop }) => costCop === null).length,
      done:
        toBuy.filter((item) => item.status === "bought").length +
        extras.filter((extra) => extra.checked).length,
      total: toBuy.length + extras.length,
    },
  };
}
