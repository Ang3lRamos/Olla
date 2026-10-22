"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { CATEGORY_LABELS, INGREDIENT_CATEGORIES, type IngredientCategory } from "@/domain/categories";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Select } from "@/ui/select";
import type { ShoppingExtra } from "../data";

/** Mientras se guarda, el extra todavía no tiene id real y no se puede tocar. */
const isSaving = (extra: ShoppingExtra) => extra.id.startsWith("nuevo-");

export function ExtraRow({
  extra,
  onCheck,
  onRemove,
}: {
  extra: ShoppingExtra;
  onCheck: (checked: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex animate-rise items-center justify-between gap-3 py-2.5 text-[15px]">
      <Checkbox
        strikeWhenChecked
        label={extra.name}
        checked={extra.checked}
        disabled={isSaving(extra)}
        onChange={(event) => onCheck(event.target.checked)}
      />
      <Button
        variant="ghost"
        size="sm"
        className="px-2 text-muted hover:text-danger"
        aria-label={`Quitar ${extra.name}`}
        disabled={isSaving(extra)}
        onClick={onRemove}
      >
        <X className="size-4" />
      </Button>
    </li>
  );
}

export function AddExtraForm({
  onAdd,
}: {
  onAdd: (name: string, category: IngredientCategory) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<IngredientCategory>("cleaning");

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) return;
        const value = name;
        setName("");
        if (!(await onAdd(value, category))) setName(value);
      }}
    >
      <p className="text-sm font-medium">¿Algo más que no esté en las recetas?</p>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          aria-label="Qué más hace falta"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej.: detergente, papel higiénico"
          maxLength={80}
          className="col-span-2 h-10 rounded-md border border-hairline-strong bg-surface px-3 text-[15px] transition-colors duration-(--dur-fast) ease-out placeholder:text-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none"
        />
        <Select
          aria-label="Categoría"
          value={category}
          onChange={(event) => setCategory(event.target.value as IngredientCategory)}
        >
          {INGREDIENT_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {CATEGORY_LABELS[option]}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary" disabled={!name.trim()}>
          <Plus className="size-4" aria-hidden />
          Agregar
        </Button>
      </div>
    </form>
  );
}
