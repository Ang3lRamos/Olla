"use client";

import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_LABELS, type RecipeCategory } from "@/domain/recipe-categories";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { matchesQuery } from "../search";
import type { RecipeSummary } from "../types";
import { RecipeCard } from "./recipe-card";

type CategoryFilter = RecipeCategory | "all";

const isCategory = (value: string | null): value is RecipeCategory =>
  RECIPE_CATEGORIES.some((category) => category === value);

export function RecipeBrowser({ recipes }: { recipes: RecipeSummary[] }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<CategoryFilter>(() => {
    const fromUrl = params.get("categoria");
    return isCategory(fromUrl) ? fromUrl : "all";
  });

  // Los filtros viven en la URL para que al volver de una receta sigan aplicados. Se usa
  // history.replaceState (Next lo sincroniza) para no pedir la página al servidor en cada tecla.
  const updateUrl = (next: { q: string; categoria: CategoryFilter }) => {
    const search = new URLSearchParams();
    if (next.q.trim()) search.set("q", next.q.trim());
    if (next.categoria !== "all") search.set("categoria", next.categoria);
    window.history.replaceState(null, "", search.size ? `?${search}` : window.location.pathname);
  };

  const visible = useMemo(
    () =>
      recipes.filter(
        (recipe) =>
          (category === "all" || recipe.category === category) && matchesQuery(recipe.searchText, query),
      ),
    [recipes, category, query],
  );

  const chooseCategory = (next: CategoryFilter) => {
    setCategory(next);
    updateUrl({ q: query, categoria: next });
  };
  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    updateUrl({ q: "", categoria: "all" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          role="group"
          aria-label="Categorías"
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0"
        >
          {(["all", ...RECIPE_CATEGORIES] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={category === option}
              onClick={() => chooseCategory(option)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors duration-(--dur-fast) ease-out",
                category === option
                  ? "border-accent bg-accent text-on-accent"
                  : "border-hairline-strong text-muted hover:border-muted hover:text-ink",
              )}
            >
              {option === "all" ? "Todas" : RECIPE_CATEGORY_LABELS[option]}
            </button>
          ))}
        </div>

        <label className="relative md:w-72">
          <span className="sr-only">Buscar recetas o ingredientes</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              updateUrl({ q: event.target.value, categoria: category });
            }}
            placeholder="Buscar: pollo, sopa, arepa…"
            className={cn(
              "h-10 w-full rounded-md border border-hairline-strong bg-surface pr-3 pl-9 text-[15px] placeholder:text-muted",
              "transition-colors duration-(--dur-fast) ease-out hover:border-muted",
              "focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none",
            )}
          />
        </label>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {visible.length === 1 ? "1 receta" : `${visible.length} recetas`}
      </p>

      {visible.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-hairline-strong p-6">
          <p>No encontramos recetas con esos filtros.</p>
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            <X className="size-4" aria-hidden />
            Quitar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
