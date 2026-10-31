"use client";

import { useMemo, useState, useTransition } from "react";
import { buildCatalog } from "@/domain/catalog";
import type { Ingredient, PantryItem } from "@/domain/types";
import { savePantryItem } from "@/features/pantry/actions";
import type { PantryItemInput } from "@/features/pantry/schemas";
import { parseDecimal } from "@/lib/decimal-input";

const toggle = (set: Set<string>, id: string) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

/**
 * La lista para armar el menú: lo de casa (se guarda en la despensa y se puede dejar fuera de
 * este menú) y lo que se piensa mercar. Lo guardado aparece al instante, antes de que llegue la
 * despensa nueva del servidor.
 */
export function useMenuList(listed: Ingredient[], savedPantry: PantryItem[]) {
  const [created, setCreated] = useState<Ingredient[]>([]);
  const [saved, setSaved] = useState<PantryItem[]>([]);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [buy, setBuy] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string>();
  const [saving, startSaving] = useTransition();

  const ingredients = useMemo(
    () => [...listed, ...created.filter((item) => !listed.some((other) => other.id === item.id))],
    [listed, created],
  );
  const catalog = useMemo(() => buildCatalog(ingredients), [ingredients]);
  const pantry = [
    ...saved.filter((item) => !savedPantry.some((other) => other.ingredientId === item.ingredientId)),
    ...savedPantry,
  ];
  const home = pantry.filter((item) => !skipped.has(item.ingredientId));

  const saveHome = (input: PantryItemInput) =>
    new Promise<boolean>((resolve) =>
      startSaving(async () => {
        const result = await savePantryItem(input);
        setSaveError(result.ok ? undefined : result.error);
        if (result.ok) {
          const item = {
            ingredientId: input.ingredientId,
            quantity: { amount: parseDecimal(input.quantity), unit: input.unit },
          };
          setSaved((current) => [
            ...current.filter((other) => other.ingredientId !== item.ingredientId),
            item,
          ]);
        }
        resolve(result.ok);
      }),
    );

  return {
    ingredients,
    catalog,
    pantry,
    home,
    /** Todo lo elegido: lo de casa que se usa y lo que se va a mercar. */
    chosen: [...home.map((item) => item.ingredientId), ...buy],
    skipped,
    toggleHome: (id: string) => setSkipped((current) => toggle(current, id)),
    buy,
    addBuy: (id: string) => setBuy((current) => [...current, id]),
    removeBuy: (id: string) => setBuy((current) => current.filter((other) => other !== id)),
    saveHome,
    saving,
    saveError,
    addCreated: (ingredient: Ingredient) => setCreated((current) => [...current, ingredient]),
  };
}
