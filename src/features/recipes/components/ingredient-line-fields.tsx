"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { NewProductPanel } from "@/features/catalog/components/new-product-panel";
import { ingredientOptions, unitOptions } from "@/features/catalog/select-options";
import type { Ingredient } from "@/domain/types";
import { compatibleUnits, type Unit } from "@/domain/units";
import { Button } from "@/ui/button";
import { Select } from "@/ui/select";
import { cn } from "@/ui/cn";

export interface IngredientLineDraft {
  key: string;
  ingredientId: string;
  quantity: string;
  unit: Unit;
  note: string;
  /** Leído de una receta pegada y que no está en el catálogo: se ofrece crearlo. */
  unmatchedName?: string | null;
}

interface IngredientLineFieldsProps {
  line: IngredientLineDraft;
  position: number;
  ingredients: Ingredient[];
  errors: Partial<Record<"ingredientId" | "quantity" | "unit" | "note", string>>;
  canRemove: boolean;
  onChange: (line: IngredientLineDraft) => void;
  onRemove: () => void;
  /** Un producto nuevo del hogar; el formulario lo suma a la lista de todas las filas. */
  onIngredientCreated: (ingredient: Ingredient) => void;
}

const FIELD =
  "h-10 w-full rounded-md border border-hairline-strong bg-surface px-3 text-[15px] placeholder:text-muted transition-colors duration-(--dur-fast) ease-out hover:border-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none aria-invalid:border-danger";

export function IngredientLineFields({
  line,
  position,
  ingredients,
  errors,
  canRemove,
  onChange,
  onRemove,
  onIngredientCreated,
}: IngredientLineFieldsProps) {
  const [creating, setCreating] = useState<string | null>(null);
  const ingredient = ingredients.find((item) => item.id === line.ingredientId);
  const units = ingredient ? compatibleUnits(ingredient) : [];
  const label = (field: string) => `${field} del ingrediente ${position}`;
  const messages = Object.values(errors).filter(Boolean);

  const chooseIngredient = (ingredientId: string, known?: Ingredient) => {
    const chosen = known ?? ingredients.find((item) => item.id === ingredientId);
    // Cada ingrediente arranca en su unidad natural: "2" de arepa son 2 unidades, no 2 g.
    onChange({ ...line, ingredientId, unit: (chosen && compatibleUnits(chosen)[0]) || line.unit });
  };

  return (
    <li className="flex animate-rise flex-col gap-2 rounded-md border border-hairline p-3 md:border-0 md:p-0">
      <div className="grid grid-cols-[1fr_auto] gap-2 md:grid-cols-[minmax(0,2fr)_6rem_9rem_minmax(0,1.5fr)_auto]">
        <Select
          aria-label={label("Ingrediente")}
          invalid={Boolean(errors.ingredientId)}
          value={line.ingredientId}
          options={ingredientOptions(ingredients)}
          onValueChange={chooseIngredient}
          placeholder="Elige un ingrediente"
          searchable
          onCreate={setCreating}
          className="col-span-1"
        />
        <Button
          type="button"
          variant="ghost"
          className="px-2.5 text-muted md:order-last"
          aria-label={`Quitar ingrediente ${position}`}
          disabled={!canRemove}
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
        <div className="col-span-2 grid grid-cols-2 gap-2 md:contents">
          <input
            aria-label={label("Cantidad")}
            aria-invalid={errors.quantity ? true : undefined}
            inputMode="decimal"
            placeholder="Cantidad"
            value={line.quantity}
            onChange={(event) => onChange({ ...line, quantity: event.target.value })}
            className={cn(FIELD, "tabular-nums")}
          />
          <Select
            aria-label={label("Unidad")}
            invalid={Boolean(errors.unit)}
            value={line.unit}
            disabled={!ingredient}
            options={unitOptions(units.length ? units : [line.unit])}
            onValueChange={(unit) => onChange({ ...line, unit })}
          />
        </div>
        <input
          aria-label={label("Nota")}
          placeholder="Nota (opcional): picada, cocida…"
          value={line.note}
          onChange={(event) => onChange({ ...line, note: event.target.value })}
          className={cn(FIELD, "col-span-2 md:col-span-1")}
        />
      </div>
      {messages.length > 0 && <p className="animate-rise text-sm text-danger">{messages.join(" ")}</p>}
      {line.unmatchedName && !line.ingredientId && creating === null && (
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
          «{line.unmatchedName}» no está en tu lista.
          <button
            type="button"
            onClick={() => setCreating(line.unmatchedName ?? "")}
            className="font-medium text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink"
          >
            Crearlo
          </button>
          o elige otro arriba.
        </p>
      )}
      {creating !== null && (
        <NewProductPanel
          initialName={creating}
          onCancel={() => setCreating(null)}
          onCreated={(created) => {
            onIngredientCreated(created);
            setCreating(null);
            chooseIngredient(created.id, created);
          }}
        />
      )}
    </li>
  );
}
