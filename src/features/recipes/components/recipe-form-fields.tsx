"use client";

import { useId } from "react";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_LABELS, type RecipeCategory } from "@/domain/recipe-categories";
import { cn } from "@/ui/cn";

export function CategoryPicker({
  value,
  onChange,
}: {
  value: RecipeCategory;
  onChange: (category: RecipeCategory) => void;
}) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-sm font-medium">
        Categoría
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
        {RECIPE_CATEGORIES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors duration-(--dur-fast) ease-out",
              value === option
                ? "border-accent bg-accent text-on-accent"
                : "border-hairline-strong text-muted hover:border-muted hover:text-ink",
            )}
          >
            {RECIPE_CATEGORY_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepsField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (steps: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        Preparación
      </label>
      <textarea
        id={id}
        rows={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint`}
        placeholder={"Sofríe la cebolla y el tomate.\nAgrega el pollo y tapa 15 minutos."}
        className={cn(
          "rounded-md border border-hairline-strong bg-surface px-3 py-2.5 text-[15px] leading-relaxed placeholder:text-muted",
          "transition-colors duration-(--dur-fast) ease-out hover:border-muted",
          "focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none aria-invalid:border-danger",
        )}
      />
      <p id={`${id}-hint`} className={cn("text-sm", error ? "text-danger" : "text-muted")}>
        {error ?? "Un paso por línea; los numeramos nosotros."}
      </p>
    </div>
  );
}
