"use client";

import { Check, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Ingredient, Quantity } from "@/domain/types";
import { compatibleUnits, UNIT_LABELS, type Unit } from "@/domain/units";
import { formatDecimalInput, parseDecimal } from "@/lib/decimal-input";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { Select } from "@/ui/select";

export type RowStatus = "idle" | "saving" | "saved" | "error";

interface PantryRowProps {
  ingredient: Ingredient;
  quantity: Quantity;
  status: RowStatus;
  error?: string;
  onSave: (quantity: Quantity) => void;
  onRemove: () => void;
}

/** Edición en línea: guarda al salir del campo, con Enter o al cambiar la unidad. */
export function PantryRow({ ingredient, quantity, status, error, onSave, onRemove }: PantryRowProps) {
  const [draft, setDraft] = useState(formatDecimalInput(quantity.amount));
  const amount = parseDecimal(draft);

  const commit = (unit: Unit = quantity.unit) => {
    if (!(amount > 0)) {
      setDraft(formatDecimalInput(quantity.amount));
      return;
    }
    if (amount !== quantity.amount || unit !== quantity.unit) onSave({ amount, unit });
  };

  return (
    <li className="flex flex-col gap-1 py-2.5">
      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_8rem_2.25rem] items-center gap-2">
        <span className="truncate">{ingredient.name}</span>
        <input
          aria-label={`Cantidad de ${ingredient.name}`}
          inputMode="decimal"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit()}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          className={cn(
            "h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-right tabular-nums",
            "transition-colors duration-(--dur-fast) ease-out hover:border-hairline-strong",
            "focus:border-accent focus:bg-surface focus:ring-3 focus:ring-accent/15 focus:outline-none",
          )}
        />
        <Select
          aria-label={`Unidad de ${ingredient.name}`}
          value={quantity.unit}
          onChange={(event) => commit(event.target.value as Unit)}
        >
          {compatibleUnits(ingredient).map((unit) => (
            <option key={unit} value={unit}>
              {UNIT_LABELS[unit].plural}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-2 text-muted hover:text-danger"
          aria-label={`Quitar ${ingredient.name}`}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <p
        aria-live="polite"
        className={cn(
          "flex h-4 items-center gap-1 text-xs transition-opacity duration-(--dur-base) ease-out",
          status === "idle" ? "opacity-0" : "opacity-100",
          status === "error" ? "text-danger" : "text-muted",
        )}
      >
        {status === "saving" && "Guardando…"}
        {status === "saved" && (
          <>
            <Check className="size-3 text-cilantro" aria-hidden /> Guardado
          </>
        )}
        {status === "error" && error}
      </p>
    </li>
  );
}
