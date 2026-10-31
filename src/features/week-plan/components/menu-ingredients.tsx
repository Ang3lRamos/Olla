"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { getIngredient, type IngredientCatalog } from "@/domain/catalog";
import type { Ingredient, PantryItem } from "@/domain/types";
import { formatQuantity, toIngredientBase } from "@/domain/units";
import { ingredientOptions } from "@/features/catalog/select-options";
import { AddPantryItem } from "@/features/pantry/components/add-pantry-item";
import type { PantryItemInput } from "@/features/pantry/schemas";
import { cn } from "@/ui/cn";
import { Select } from "@/ui/select";

type Source = "home" | "market";

const chipClass =
  "flex items-center gap-1 rounded-full border py-1 pr-2 pl-3 text-sm transition-colors duration-(--dur-fast) ease-out";

interface MenuIngredientsProps {
  ingredients: Ingredient[];
  catalog: IngredientCatalog;
  /** Toda la despensa; las que están en `skipped` no se usan en este menú. */
  pantry: PantryItem[];
  skipped: Set<string>;
  onToggleHome: (ingredientId: string) => void;
  buy: string[];
  onAddBuy: (ingredientId: string) => void;
  onRemoveBuy: (ingredientId: string) => void;
  /** Guarda en la despensa lo que la persona dice tener en casa. */
  onSaveHome: (item: PantryItemInput) => Promise<boolean>;
  saving: boolean;
  saveError?: string;
  onIngredientCreated: (ingredient: Ingredient) => void;
}

/** Lo que hay en casa (con cantidad, va a la despensa) y lo que se piensa mercar. */
export function MenuIngredients(props: MenuIngredientsProps) {
  const { catalog, pantry, skipped, buy } = props;
  const [source, setSource] = useState<Source>("home");
  const listed = new Set([...pantry.map((item) => item.ingredientId), ...buy]);
  const available = props.ingredients.filter((ingredient) => !listed.has(ingredient.id));

  return (
    <div className="flex flex-col gap-4">
      <div
        role="radiogroup"
        aria-label="Dónde está"
        className="grid grid-cols-2 rounded-md border border-hairline bg-sunken p-0.5"
      >
        {(["home", "market"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={source === value}
            onClick={() => setSource(value)}
            className={cn(
              "h-8 rounded-sm px-2 text-sm transition-colors duration-(--dur-fast) ease-out",
              source === value
                ? "bg-surface font-medium text-ink shadow-raised"
                : "text-muted hover:text-ink",
            )}
          >
            {value === "home" ? "Lo tengo en casa" : "Lo voy a mercar"}
          </button>
        ))}
      </div>

      {source === "home" ? (
        <AddPantryItem
          ingredients={available}
          pending={props.saving}
          error={props.saveError}
          onAdd={props.onSaveHome}
          onIngredientCreated={props.onIngredientCreated}
          compact
        />
      ) : (
        <Select
          aria-label="Agregar lo que vas a mercar"
          value=""
          options={ingredientOptions(available)}
          onValueChange={props.onAddBuy}
          placeholder="¿Qué vas a mercar? Pollo, papa, mazorca…"
          searchable
        />
      )}

      {pantry.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">En casa</p>
          <ul className="flex flex-wrap gap-1.5">
            {pantry.map((item) => {
              const ingredient = getIngredient(catalog, item.ingredientId);
              const used = !skipped.has(item.ingredientId);
              return (
                <li key={item.ingredientId}>
                  <button
                    type="button"
                    aria-pressed={used}
                    onClick={() => props.onToggleHome(item.ingredientId)}
                    className={cn(
                      chipClass,
                      "pr-3",
                      used
                        ? "border-hairline-strong hover:border-muted"
                        : "border-hairline text-muted line-through hover:text-ink",
                    )}
                  >
                    {ingredient.name}
                    <span className="text-xs text-muted tabular-nums">
                      {formatQuantity(toIngredientBase(item.quantity, ingredient))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted">
            Toca uno para dejarlo fuera de este menú; tu despensa no cambia.
          </p>
        </div>
      )}

      {buy.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Por mercar</p>
          <ul className="flex flex-wrap gap-1.5">
            {buy.map((id) => {
              const name = getIngredient(catalog, id).name;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => props.onRemoveBuy(id)}
                    aria-label={`Quitar ${name}`}
                    className={cn(chipClass, "border-hairline-strong hover:border-muted")}
                  >
                    {name}
                    <X className="size-3.5 text-muted" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
