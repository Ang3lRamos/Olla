"use client";

import { useId, useState, useTransition } from "react";
import type { IngredientCategory } from "@/domain/categories";
import type { Ingredient } from "@/domain/types";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { Select } from "@/ui/select";
import { createIngredient } from "../actions";
import { MEASURES } from "../schemas";
import { categoryOptions } from "../select-options";

type Measure = (typeof MEASURES)[number]["value"];

interface NewProductPanelProps {
  initialName: string;
  onCreated: (ingredient: Ingredient) => void;
  onCancel: () => void;
}

const FIELD =
  "h-10 w-full rounded-md border border-hairline-strong bg-surface px-3 text-[15px] transition-colors duration-(--dur-fast) ease-out placeholder:text-muted hover:border-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none";

/** Crea un producto que no está en el catálogo, con lo mínimo: nombre, categoría y cómo se mide. */
export function NewProductPanel({ initialName, onCreated, onCancel }: NewProductPanelProps) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<IngredientCategory>("pantry");
  const [measure, setMeasure] = useState<Measure>("g");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const titleId = useId();

  const create = () =>
    startTransition(async () => {
      const result = await createIngredient({ name, category, baseUnit: measure });
      if (result.ok) onCreated(result.ingredient);
      else setError(result.error);
    });

  return (
    <section
      aria-labelledby={titleId}
      className="flex animate-rise flex-col gap-4 rounded-md border border-ink bg-surface p-4"
    >
      <div className="flex flex-col gap-0.5">
        <h3 id={titleId} className="font-medium">
          Nuevo producto
        </h3>
        <p className="text-sm text-muted">
          Queda guardado para tu hogar: en la despensa, el mercado y tus recetas.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Nombre
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            className={FIELD}
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium" id={`${titleId}-category`}>
            Categoría
          </span>
          <Select
            aria-label="Categoría del producto"
            value={category}
            options={categoryOptions}
            onValueChange={setCategory}
          />
        </div>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">¿Cómo lo mides?</legend>
        <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
          {MEASURES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={measure === option.value}
              onClick={() => setMeasure(option.value)}
              className={cn(
                "flex flex-col rounded-md border px-3 py-2 text-left transition-colors duration-(--dur-fast) ease-out",
                measure === option.value
                  ? "border-ink"
                  : "border-hairline-strong text-muted hover:border-muted hover:text-ink",
              )}
            >
              <span className="text-[15px] font-medium text-ink">{option.label}</span>
              <span className="text-xs text-muted">{option.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={create} loading={pending} disabled={name.trim().length < 2}>
          Crear producto
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </section>
  );
}
