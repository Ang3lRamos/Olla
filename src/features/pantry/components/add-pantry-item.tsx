"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import type { Ingredient } from "@/domain/types";
import { compatibleUnits, type Unit } from "@/domain/units";
import { NewProductPanel } from "@/features/catalog/components/new-product-panel";
import { ingredientOptions, unitOptions } from "@/features/catalog/select-options";
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
  /** Un producto nuevo del hogar; la despensa lo conoce antes de que el servidor lo traiga. */
  onIngredientCreated: (ingredient: Ingredient) => void;
  /** En un panel angosto: el ingrediente arriba y cantidad, unidad y botón debajo. */
  compact?: boolean;
}

export function AddPantryItem({
  ingredients,
  pending,
  error,
  onAdd,
  onIngredientCreated,
  compact = false,
}: AddPantryItemProps) {
  const [ingredientId, setIngredientId] = useState("");
  const [creating, setCreating] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit>("g");
  const selectRef = useRef<HTMLButtonElement>(null);
  const selected = ingredients.find((ingredient) => ingredient.id === ingredientId);
  const units = selected ? compatibleUnits(selected) : [];

  const choose = (id: string, known?: Ingredient) => {
    setIngredientId(id);
    const chosen = known ?? ingredients.find((ingredient) => ingredient.id === id);
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
    <div className="flex flex-col gap-3">
      <form
        onSubmit={submit}
        className="flex flex-col gap-2 rounded-md border border-hairline bg-surface p-4"
      >
        <p className="text-sm font-medium">Agregar a la despensa</p>
        <div
          className={cn(
            "grid gap-2",
            compact
              ? "grid-cols-[5.5rem_minmax(0,1fr)_auto]"
              : "sm:grid-cols-[minmax(0,1fr)_6.5rem_9rem_auto]",
          )}
        >
          <Select
            ref={selectRef}
            aria-label="Ingrediente"
            className={compact ? "col-span-full" : undefined}
            value={ingredientId}
            options={ingredientOptions(ingredients)}
            onValueChange={choose}
            placeholder="¿Qué tienes en casa?"
            searchable
            onCreate={setCreating}
          />
          <div className={compact ? "contents" : "grid grid-cols-2 gap-2 sm:contents"}>
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
              options={unitOptions(units.length ? units : [unit])}
              onValueChange={setUnit}
            />
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
        <p className="text-xs text-muted">¿No está en la lista? Escríbelo en el buscador y créalo.</p>
      </form>
      {creating !== null && (
        <NewProductPanel
          initialName={creating}
          onCancel={() => setCreating(null)}
          onCreated={(ingredient) => {
            onIngredientCreated(ingredient);
            setCreating(null);
            choose(ingredient.id, ingredient);
          }}
        />
      )}
    </div>
  );
}
