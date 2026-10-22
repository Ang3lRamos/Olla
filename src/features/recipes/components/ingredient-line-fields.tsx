"use client";

import { X } from "lucide-react";
import { IngredientOptions } from "@/features/catalog/components/ingredient-options";
import type { Ingredient } from "@/domain/types";
import { compatibleUnits, UNIT_LABELS, type Unit } from "@/domain/units";
import { Button } from "@/ui/button";
import { Select } from "@/ui/select";
import { cn } from "@/ui/cn";

export interface IngredientLineDraft {
  key: string;
  ingredientId: string;
  quantity: string;
  unit: Unit;
  note: string;
}

interface IngredientLineFieldsProps {
  line: IngredientLineDraft;
  position: number;
  ingredients: Ingredient[];
  errors: Partial<Record<"ingredientId" | "quantity" | "unit" | "note", string>>;
  canRemove: boolean;
  onChange: (line: IngredientLineDraft) => void;
  onRemove: () => void;
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
}: IngredientLineFieldsProps) {
  const ingredient = ingredients.find((item) => item.id === line.ingredientId);
  const units = ingredient ? compatibleUnits(ingredient) : [];
  const label = (field: string) => `${field} del ingrediente ${position}`;
  const messages = Object.values(errors).filter(Boolean);

  const chooseIngredient = (ingredientId: string) => {
    const chosen = ingredients.find((item) => item.id === ingredientId);
    // Cada ingrediente arranca en su unidad natural: "2" de arepa son 2 unidades, no 2 g.
    onChange({ ...line, ingredientId, unit: (chosen && compatibleUnits(chosen)[0]) || line.unit });
  };

  return (
    <li className="flex animate-rise flex-col gap-2 rounded-md border border-hairline p-3 md:border-0 md:p-0">
      <div className="grid grid-cols-[1fr_auto] gap-2 md:grid-cols-[minmax(0,2fr)_6rem_9rem_minmax(0,1.5fr)_auto]">
        <Select
          aria-label={label("Ingrediente")}
          aria-invalid={errors.ingredientId ? true : undefined}
          value={line.ingredientId}
          onChange={(event) => chooseIngredient(event.target.value)}
          className="col-span-1"
        >
          <option value="" disabled>
            Elige un ingrediente
          </option>
          <IngredientOptions ingredients={ingredients} />
        </Select>
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
            aria-invalid={errors.unit ? true : undefined}
            value={line.unit}
            disabled={!ingredient}
            onChange={(event) => onChange({ ...line, unit: event.target.value as Unit })}
          >
            {(units.length ? units : [line.unit]).map((unit) => (
              <option key={unit} value={unit}>
                {UNIT_LABELS[unit].plural}
              </option>
            ))}
          </Select>
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
    </li>
  );
}
