"use client";

import { Check, Clock, Search } from "lucide-react";
import { useState } from "react";
import { formatCop } from "@/domain/money";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_LABELS, type RecipeCategory } from "@/domain/recipe-categories";
import type { Meal } from "@/domain/week";
import { matchesQuery } from "@/features/recipes/search";
import type { RecipeSummary } from "@/features/recipes/types";
import { cn } from "@/ui/cn";

/** Sugerencia inicial según la comida; se puede cambiar a cualquier categoría. */
const DEFAULT_CATEGORY: Record<Meal, RecipeCategory | "all"> = {
  breakfast: "breakfast",
  lunch: "all",
  dinner: "all",
};

interface RecipePickerProps {
  meal: Meal;
  recipes: RecipeSummary[];
  usage: ReadonlyMap<string, number>;
  selectedId: string | null;
  onPick: (recipeId: string) => void;
}

export function RecipePicker({ meal, recipes, usage, selectedId, onPick }: RecipePickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RecipeCategory | "all">(DEFAULT_CATEGORY[meal]);
  const visible = recipes.filter(
    (recipe) =>
      (category === "all" || recipe.category === category) && matchesQuery(recipe.searchText, query),
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="relative">
        <span className="sr-only">Buscar receta</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar receta o ingrediente"
          className="h-10 w-full rounded-md border border-hairline-strong bg-surface pr-3 pl-9 text-[15px] transition-colors duration-(--dur-fast) ease-out placeholder:text-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none"
        />
      </label>

      <div role="group" aria-label="Categorías" className="-mx-5 flex gap-1.5 overflow-x-auto px-5">
        {(["all", ...RECIPE_CATEGORIES] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={category === option}
            onClick={() => setCategory(option)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors duration-(--dur-fast) ease-out",
              category === option
                ? "border-accent bg-accent text-on-accent"
                : "border-hairline-strong text-muted hover:text-ink",
            )}
          >
            {option === "all" ? "Todas" : RECIPE_CATEGORY_LABELS[option]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No hay recetas con ese filtro.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-hairline">
          {visible.map((recipe) => {
            const timesThisWeek = usage.get(recipe.id) ?? 0;
            const selected = recipe.id === selectedId;
            return (
              <li key={recipe.id}>
                <button
                  type="button"
                  onClick={() => onPick(recipe.id)}
                  aria-current={selected || undefined}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-(--dur-fast) ease-out hover:bg-sunken active:bg-hairline"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{recipe.name}</span>
                    <span className="flex items-center gap-2 text-xs text-muted">
                      {RECIPE_CATEGORY_LABELS[recipe.category]}
                      {recipe.prepMinutes && (
                        <span className="flex items-center gap-0.5 tabular-nums">
                          <Clock className="size-3" aria-hidden />
                          {recipe.prepMinutes} min
                        </span>
                      )}
                      {timesThisWeek > 0 && (
                        <span className="text-ink">
                          ·{" "}
                          {timesThisWeek === 1 ? "ya está esta semana" : `${timesThisWeek} veces esta semana`}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums">
                    {formatCop(recipe.costPerServingCop)}
                    <span className="text-xs text-muted"> /porción</span>
                  </span>
                  {selected && <Check className="size-4 shrink-0" aria-label="Elegida" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
