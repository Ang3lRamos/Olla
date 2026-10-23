"use client";

import { useState } from "react";
import type { Ingredient, Quantity } from "@/domain/types";
import { compatibleUnits, type Unit } from "@/domain/units";
import { unitOptions } from "@/features/catalog/select-options";
import { parseDecimal } from "@/lib/decimal-input";
import { Button } from "@/ui/button";
import { Select } from "@/ui/select";

interface PartialPurchaseProps {
  ingredient: Ingredient;
  onSave: (quantity: Quantity) => void;
}

/** "Compré otra cantidad": registra lo que de verdad se compró cuando no fue todo lo de la lista. */
export function PartialPurchase({ ingredient, onSave }: PartialPurchaseProps) {
  const units = compatibleUnits(ingredient);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<Unit>(units[0] ?? "unit");
  const value = parseDecimal(amount);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-fit text-xs text-muted underline decoration-hairline-strong underline-offset-4 transition-colors duration-(--dur-fast) hover:text-ink"
      >
        Compré otra cantidad
      </button>
    );
  }

  return (
    <form
      className="mt-1 flex animate-rise flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!(value > 0)) return;
        onSave({ amount: value, unit });
        setOpen(false);
        setAmount("");
      }}
    >
      <label className="sr-only" htmlFor={`compra-${ingredient.id}`}>
        Cuánto compraste de {ingredient.name}
      </label>
      <input
        id={`compra-${ingredient.id}`}
        autoFocus
        inputMode="decimal"
        placeholder="¿Cuánto?"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        className="h-8 w-20 rounded-md border border-hairline-strong bg-surface px-2 text-sm tabular-nums transition-colors duration-(--dur-fast) ease-out focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none"
      />
      <Select
        aria-label={`Unidad de lo que compraste de ${ingredient.name}`}
        value={unit}
        options={unitOptions(units)}
        onValueChange={setUnit}
        className="w-36 [&_button]:h-8 [&_button]:text-sm"
      />
      <Button type="submit" size="sm" disabled={!(value > 0)}>
        Guardar
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
    </form>
  );
}
