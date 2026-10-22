"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { buildCatalog, getIngredient } from "@/domain/catalog";
import { CATEGORY_LABELS, INGREDIENT_CATEGORIES } from "@/domain/categories";
import type { Ingredient, Quantity } from "@/domain/types";
import { parseDecimal } from "@/lib/decimal-input";
import { removePantryItem, savePantryItem } from "../actions";
import type { PantryEntry } from "../data";
import type { PantryItemInput } from "../schemas";
import { AddPantryItem } from "./add-pantry-item";
import { PantryRow, type RowStatus } from "./pantry-row";

type OptimisticChange = { type: "upsert"; entry: PantryEntry } | { type: "remove"; ingredientId: string };

const SAVED_FEEDBACK_MS = 1600;

function applyChange(items: PantryEntry[], change: OptimisticChange): PantryEntry[] {
  const others = items.filter(
    (item) =>
      item.ingredientId !== (change.type === "upsert" ? change.entry.ingredientId : change.ingredientId),
  );
  return change.type === "upsert" ? [...others, change.entry] : others;
}

interface PantryManagerProps {
  items: PantryEntry[];
  ingredients: Ingredient[];
}

export function PantryManager({ items, ingredients }: PantryManagerProps) {
  const [optimisticItems, applyOptimistic] = useOptimistic(items, applyChange);
  const [statuses, setStatuses] = useState<Record<string, { status: RowStatus; error?: string }>>({});
  const [addError, setAddError] = useState<string>();
  const [adding, startAdding] = useTransition();
  const [, startSaving] = useTransition();
  const feedbackTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const catalog = buildCatalog(ingredients);

  const setStatus = (ingredientId: string, status: RowStatus, error?: string) => {
    clearTimeout(feedbackTimers.current.get(ingredientId));
    setStatuses((current) => ({ ...current, [ingredientId]: { status, error } }));
    if (status === "saved") {
      const timer = setTimeout(() => setStatus(ingredientId, "idle"), SAVED_FEEDBACK_MS);
      feedbackTimers.current.set(ingredientId, timer);
    }
  };

  const add = (input: PantryItemInput) =>
    new Promise<boolean>((resolve) =>
      startAdding(async () => {
        const amount = parseDecimal(input.quantity);
        if (amount > 0) {
          const entry = {
            id: `nuevo-${input.ingredientId}`,
            ingredientId: input.ingredientId,
            quantity: { amount, unit: input.unit },
          };
          applyOptimistic({ type: "upsert", entry });
        }
        const result = await savePantryItem(input);
        setAddError(result.ok ? undefined : result.error);
        resolve(result.ok);
      }),
    );

  const save = (entry: PantryEntry, quantity: Quantity) =>
    startSaving(async () => {
      applyOptimistic({ type: "upsert", entry: { ...entry, quantity } });
      setStatus(entry.ingredientId, "saving");
      const result = await savePantryItem({
        ingredientId: entry.ingredientId,
        quantity: quantity.amount,
        unit: quantity.unit,
      });
      if (result.ok) setStatus(entry.ingredientId, "saved");
      else setStatus(entry.ingredientId, "error", result.error);
    });

  const remove = (entry: PantryEntry) =>
    startSaving(async () => {
      applyOptimistic({ type: "remove", ingredientId: entry.ingredientId });
      const result = await removePantryItem(entry.id);
      if (!result.ok) setStatus(entry.ingredientId, "error", result.error);
    });

  const inPantry = new Set(optimisticItems.map((item) => item.ingredientId));
  const groups = INGREDIENT_CATEGORIES.map((category) => ({
    category,
    entries: optimisticItems
      .filter((item) => getIngredient(catalog, item.ingredientId).category === category)
      .sort((a, b) =>
        getIngredient(catalog, a.ingredientId).name.localeCompare(
          getIngredient(catalog, b.ingredientId).name,
          "es",
        ),
      ),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <AddPantryItem
        ingredients={ingredients.filter((ingredient) => !inPantry.has(ingredient.id))}
        pending={adding}
        error={addError}
        onAdd={add}
      />

      {groups.length === 0 ? (
        <div className="rounded-md border border-dashed border-hairline-strong p-6 text-muted">
          <p className="font-medium text-ink">Tu despensa está vacía.</p>
          <p className="mt-1 text-sm">
            Agrega lo que ya tienes en casa, aunque sea aproximado. Lo restamos del mercado para que no
            compres de más.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.category} aria-labelledby={`pantry-${group.category}`} className="animate-rise">
            <h2 id={`pantry-${group.category}`} className="mb-1 letrero text-sm text-muted">
              {CATEGORY_LABELS[group.category]}
            </h2>
            <ul className="divide-y divide-hairline border-y border-hairline">
              {group.entries.map((entry) => (
                <PantryRow
                  key={entry.ingredientId}
                  ingredient={getIngredient(catalog, entry.ingredientId)}
                  quantity={entry.quantity}
                  status={statuses[entry.ingredientId]?.status ?? "idle"}
                  error={statuses[entry.ingredientId]?.error}
                  onSave={(quantity) => save(entry, quantity)}
                  onRemove={() => remove(entry)}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
