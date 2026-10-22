"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { IngredientCategory } from "@/domain/categories";
import type { Purchase } from "@/domain/shopping-status";
import type { BaseUnit } from "@/domain/units";
import {
  addExtra,
  markPurchased,
  removeExtra,
  setExtraChecked,
  unmarkPurchased,
  type ShoppingActionResult,
} from "../actions";
import type { ShoppingExtra } from "../data";

interface ShoppingState {
  purchases: Purchase[];
  extras: ShoppingExtra[];
}

type ShoppingChange =
  | { type: "purchase"; purchase: Purchase }
  | { type: "unpurchase"; ingredientId: string; unit: BaseUnit }
  | { type: "add-extra"; extra: ShoppingExtra }
  | { type: "check-extra"; id: string; checked: boolean }
  | { type: "remove-extra"; id: string };

const isPurchase = (item: Purchase, ingredientId: string, unit: BaseUnit) =>
  item.ingredientId === ingredientId && item.quantity.unit === unit;

function applyChange(state: ShoppingState, change: ShoppingChange): ShoppingState {
  switch (change.type) {
    case "purchase": {
      const { ingredientId, quantity } = change.purchase;
      const others = state.purchases.filter((item) => !isPurchase(item, ingredientId, quantity.unit));
      return { ...state, purchases: [...others, change.purchase] };
    }
    case "unpurchase":
      return {
        ...state,
        purchases: state.purchases.filter((item) => !isPurchase(item, change.ingredientId, change.unit)),
      };
    case "add-extra":
      return { ...state, extras: [...state.extras, change.extra] };
    case "check-extra":
      return {
        ...state,
        extras: state.extras.map((extra) =>
          extra.id === change.id ? { ...extra, checked: change.checked } : extra,
        ),
      };
    case "remove-extra":
      return { ...state, extras: state.extras.filter((extra) => extra.id !== change.id) };
  }
}

export function useShopping(weekStart: string, saved: ShoppingState) {
  const [state, applyOptimistic] = useOptimistic(saved, applyChange);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  const run = (change: ShoppingChange, save: () => Promise<ShoppingActionResult>) =>
    new Promise<boolean>((resolve) =>
      startTransition(async () => {
        applyOptimistic(change);
        const result = await save();
        setError(result.ok ? undefined : result.error);
        resolve(result.ok);
      }),
    );

  return {
    ...state,
    error,
    dismissError: () => setError(undefined),
    purchase: (purchase: Purchase) =>
      run({ type: "purchase", purchase }, () =>
        markPurchased({
          weekStart,
          ingredientId: purchase.ingredientId,
          unit: purchase.quantity.unit,
          quantity: purchase.quantity.amount,
        }),
      ),
    unpurchase: (ingredientId: string, unit: BaseUnit) =>
      run({ type: "unpurchase", ingredientId, unit }, () =>
        unmarkPurchased({ weekStart, ingredientId, unit }),
      ),
    addExtra: (name: string, category: IngredientCategory) =>
      run(
        {
          type: "add-extra",
          extra: { id: `nuevo-${crypto.randomUUID()}`, name: name.trim(), category, checked: false },
        },
        () => addExtra({ weekStart, name, category }),
      ),
    checkExtra: (id: string, checked: boolean) =>
      run({ type: "check-extra", id, checked }, () => setExtraChecked(id, checked)),
    removeExtra: (id: string) => run({ type: "remove-extra", id }, () => removeExtra(id)),
  };
}
