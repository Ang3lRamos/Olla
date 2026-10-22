"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { CATEGORY_LABELS, INGREDIENT_CATEGORIES } from "@/domain/categories";
import type { Ingredient } from "@/domain/types";
import { matchesQuery, normalizeForSearch } from "@/features/recipes/search";
import { cn } from "@/ui/cn";
import { PriceRow, type PriceValue } from "./price-row";

export interface PriceTableRow {
  ingredient: Ingredient;
  price: PriceValue | null;
  isOwn: boolean;
  usedThisWeek: boolean;
}

export function PriceTable({ rows }: { rows: PriceTableRow[] }) {
  const anyUsed = rows.some((row) => row.usedThisWeek);
  const [onlyThisWeek, setOnlyThisWeek] = useState(anyUsed);
  const [query, setQuery] = useState("");

  const visible = rows.filter(
    (row) =>
      (!onlyThisWeek || row.usedThisWeek) && matchesQuery(normalizeForSearch(row.ingredient.name), query),
  );
  const groups = INGREDIENT_CATEGORIES.map((category) => ({
    category,
    rows: visible.filter((row) => row.ingredient.category === category),
  })).filter((group) => group.rows.length > 0);

  return (
    <section aria-labelledby="prices-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="prices-title" className="font-medium">
          Precios
        </h2>
        <p className="text-sm text-muted">
          Vienen con un precio de referencia aproximado. Pon lo que compras tú —cuánto pagas, cuánto trae y en
          cuántas porciones viene— y el mercado se cuenta en esos paquetes.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="radiogroup"
          aria-label="Qué ingredientes mostrar"
          className="inline-flex w-fit rounded-md border border-hairline bg-sunken p-0.5"
        >
          {[
            { value: true, label: "De esta semana", disabled: !anyUsed },
            { value: false, label: "Todos" },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={onlyThisWeek === option.value}
              disabled={option.disabled}
              onClick={() => setOnlyThisWeek(option.value)}
              className={cn(
                "h-7 rounded-sm px-3 text-sm transition-colors duration-(--dur-fast) ease-out disabled:opacity-40",
                onlyThisWeek === option.value
                  ? "bg-surface text-ink shadow-raised"
                  : "text-muted hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="relative sm:w-64">
          <span className="sr-only">Buscar ingrediente</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ingrediente"
            className="h-9 w-full rounded-md border border-hairline-strong bg-surface pr-3 pl-9 text-sm transition-colors duration-(--dur-fast) ease-out placeholder:text-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none"
          />
        </label>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-md border border-dashed border-hairline-strong p-4 text-sm text-muted">
          No hay ingredientes con ese filtro.
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.category}>
            <h3 className="mb-1 letrero text-xs text-muted">{CATEGORY_LABELS[group.category]}</h3>
            <ul className="divide-y divide-hairline border-y border-hairline">
              {group.rows.map((row) => (
                <PriceRow key={row.ingredient.id} {...row} />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
