import { CATEGORY_LABELS, INGREDIENT_CATEGORIES, type IngredientCategory } from "@/domain/categories";
import { getIngredient, type IngredientCatalog } from "@/domain/catalog";
import type { PriceList } from "@/domain/costs";
import { formatPackages, formatPieces, piecesIn, planPurchase, type PurchasePlan } from "@/domain/packages";
import { stockBeforePurchases } from "@/domain/pantry";
import { buildShoppingLines } from "@/domain/shopping-list";
import { reconcilePurchases, type Purchase, type ShoppingItem } from "@/domain/shopping-status";
import type { BaseQuantity, PantryItem, Recipe } from "@/domain/types";
import { toPlannedMeals, type PlannedSlot } from "@/domain/week-plan";
import type { ShoppingExtra } from "./data";

export interface PricedItem {
  item: ShoppingItem;
  /** Cómo se compra lo que falta, o lo que se compró si ya está marcado. */
  purchase: PurchasePlan;
  /** Lo que entra a la casa al marcarlo comprado: todo el menú, en paquetes completos. */
  purchaseFull: PurchasePlan;
  /** "1 paquete" cuando el hogar dijo en qué lo compra. */
  packagesLabel: string | null;
  /** Lo que pide el menú en porciones ("≈ 6 tajadas"), si la presentación las tiene. */
  neededPieces: string | null;
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
  // Lo ya cocinado salió de la despensa y no se vuelve a comprar; lo ya comprado entró a ella.
  const meals = toPlannedMeals(
    slots.filter((slot) => !slot.cooked),
    recipes,
    people,
  );
  const stock = stockBeforePurchases(pantry, purchases, catalog);
  const items = reconcilePurchases(buildShoppingLines(meals, stock, catalog), purchases);
  const toBuy = items.filter((item) => item.status !== "in-pantry");

  const plan = (ingredientId: string, quantity: BaseQuantity) =>
    planPurchase(quantity, getIngredient(catalog, ingredientId), prices.get(ingredientId));
  const priced = toBuy.map((item): PricedItem => {
    const price = prices.get(item.ingredientId);
    const purchaseFull = plan(item.ingredientId, item.toBuy);
    const purchase = item.status === "bought" ? purchaseFull : plan(item.ingredientId, item.remaining);
    const pieces = piecesIn(item.needed, getIngredient(catalog, item.ingredientId), price);
    return {
      item,
      purchase,
      purchaseFull,
      packagesLabel: price && purchase.packages ? formatPackages(purchase.packages, price) : null,
      neededPieces: pieces !== null && price?.pieces ? formatPieces(pieces, price.pieces.label) : null,
    };
  });
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
      marketCop: sum(priced.map(({ purchaseFull }) => purchaseFull.costCop)),
      pendingCop: sum(priced.map(({ item }) => plan(item.ingredientId, item.remaining).costCop)),
      unpricedCount: priced.filter(({ purchaseFull }) => purchaseFull.costCop === null).length,
      done:
        toBuy.filter((item) => item.status === "bought").length +
        extras.filter((extra) => extra.checked).length,
      total: toBuy.length + extras.length,
    },
  };
}
