"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import type { Ingredient } from "@/domain/types";
import { compatibleUnits, UNIT_LABELS, type Unit } from "@/domain/units";
import { IngredientOptions } from "@/features/catalog/components/ingredient-options";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { Select } from "@/ui/select";
import type { PantryItemInput } from "../schemas";

interface AddPantryItemProps {
  /** Solo los que aún no están en la despensa. */
  ingredients: Ingredient[];
  pending: boolean;
  error?: string;
  onAdd: (item: PantryItemInput) => Promise<boolean>;
}

export function AddPantryItem({ ingredients, pending, error, onAdd }: AddPantryItemProps) {
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit>("g");
  const selectRef = useRef<HTMLSelectElement>(null);
  const selected = ingredients.find((ingredient) => ingredient.id === ingredientId);
  const units = selected ? compatibleUnits(selected) : [];

  const choose = (id: string) => {
    setIngredientId(id);
    const chosen = ingredients.find((ingredient) => ingredient.id === id);
    if (chosen) setUnit(compatibleUnits(chosen)[0] ?? "g");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!(await onAdd({ ingredientId, quantity, unit }))) return;
    setIngredientId("");
    setQuantity("");
    // Deja el foco listo para seguir agregando sin tocar el mouse.
    selectRef.current?.focus();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-md border border-hairline bg-surface p-4">
      <p className="text-sm font-medium">Agregar a la despensa</p>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_6.5rem_9rem_auto]">
        <Select
          ref={selectRef}
          aria-label="Ingrediente"
          value={ingredientId}
          onChange={(event) => choose(event.target.value)}
        >
          <option value="" disabled>
            ¿Qué tienes en casa?
          </option>
          <IngredientOptions ingredients={ingredients} />
        </Select>
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <input
            aria-label="Cantidad aproximada"
            inputMode="decimal"
            placeholder="Cantidad"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className={cn(
              "h-10 w-full rounded-md border border-hairline-strong bg-surface px-3 text-[15px] tabular-nums placeholder:text-muted",
              "transition-colors duration-(--dur-fast) ease-out hover:border-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none",
            )}
          />
          <Select
            aria-label="Unidad"
            value={unit}
            disabled={!selected}
            onChange={(event) => setUnit(event.target.value as Unit)}
          >
            {(units.length ? units : [unit]).map((option) => (
              <option key={option} value={option}>
                {UNIT_LABELS[option].plural}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" loading={pending} disabled={!ingredientId || !quantity.trim()}>
          <Plus className="size-4" aria-hidden />
          Agregar
        </Button>
      </div>
      {error && (
        <p role="alert" className="animate-rise text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
