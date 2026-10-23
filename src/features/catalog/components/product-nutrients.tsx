"use client";

import { useState, useTransition } from "react";
import { NUTRIENT_KEYS, NUTRIENT_LABELS, type NutrientKey } from "@/domain/nutrition-goals";
import type { Ingredient } from "@/domain/types";
import { formatDecimalInput } from "@/lib/decimal-input";
import { Button } from "@/ui/button";
import { saveIngredientNutrients } from "../actions";

const BASIS_LABELS: Record<Ingredient["baseUnit"], string> = {
  g: "por 100 g",
  ml: "por 100 ml",
  unit: "por unidad",
};

const FIELD =
  "h-9 w-full rounded-md border border-hairline-strong bg-surface px-2 pr-10 text-right text-[15px] tabular-nums transition-colors duration-(--dur-fast) ease-out placeholder:text-muted hover:border-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none";

type Draft = Record<NutrientKey, string>;

const toDraft = (product: Ingredient): Draft =>
  Object.fromEntries(
    NUTRIENT_KEYS.map((key) => [key, product.nutrients ? formatDecimalInput(product.nutrients[key]) : ""]),
  ) as Draft;

/** Datos de nutrición de un producto propio, tal como los trae la tabla del empaque. */
export function ProductNutrients({ product, onDone }: { product: Ingredient; onDone: () => void }) {
  const [draft, setDraft] = useState(() => toDraft(product));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const save = (values: Draft) =>
    startTransition(async () => {
      const result = await saveIngredientNutrients({ id: product.id, values });
      if (result.ok) onDone();
      else setError(result.error);
    });
  const empty = Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, ""])) as Draft;

  return (
    <div className="flex animate-rise flex-col gap-3 rounded-md bg-sunken/60 p-3">
      <p className="text-sm text-muted">
        Cópialos de la tabla nutricional del empaque, {BASIS_LABELS[product.baseUnit]}. Lo que dejes vacío
        cuenta como 0.
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
        {NUTRIENT_KEYS.map((key) => {
          const { name, unit } = NUTRIENT_LABELS[key];
          return (
            <label key={key} className="flex flex-col gap-1 text-sm">
              <span className="text-muted">{name}</span>
              <span className="relative">
                <input
                  inputMode="decimal"
                  placeholder="—"
                  value={draft[key]}
                  onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                  className={FIELD}
                />
                <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted">
                  {unit}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => save(draft)} loading={pending}>
          Guardar nutrición
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        {product.nutrients && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-muted hover:text-danger"
            onClick={() => save(empty)}
            disabled={pending}
          >
            Quitar datos
          </Button>
        )}
      </div>
    </div>
  );
}
