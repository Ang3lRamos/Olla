"use client";

import { useId, useState } from "react";
import type { DetailLevel } from "@/domain/detail-level";
import { cn } from "@/ui/cn";

const OPTIONS: Array<{ value: DetailLevel; title: string; example: string; body: string }> = [
  {
    value: "simple",
    title: "Sencillo",
    example: "1 ½ libras de papa · ajo y sal al gusto",
    body: "Lo principal en medidas de cocina; condimentos sin medir.",
  },
  {
    value: "detailed",
    title: "Detallado",
    example: "750 g de papa · 10 g de ajo · 5 g de sal",
    body: "Cada ingrediente con su cantidad exacta.",
  },
];

/** Cómo quiere ver las recetas el hogar; el mercado y los costos se calculan igual. */
export function DetailLevelField({ defaultValue }: { defaultValue: DetailLevel }) {
  const [value, setValue] = useState(defaultValue);
  const labelId = useId();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend id={labelId} className="mb-2 text-sm font-medium">
        ¿Cómo quieres ver las recetas?
      </legend>
      <input type="hidden" name="detail" value={value} />
      <div role="radiogroup" aria-labelledby={labelId} className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => setValue(option.value)}
            className={cn(
              "flex flex-col gap-1 rounded-md border p-3 text-left transition-colors duration-(--dur-fast) ease-out",
              value === option.value
                ? "border-ink bg-surface"
                : "border-hairline-strong text-muted hover:border-muted hover:text-ink",
            )}
          >
            <span className="font-medium text-ink">{option.title}</span>
            <span className="text-sm">{option.body}</span>
            <span className="text-xs text-muted italic">{option.example}</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">Lo puedes cambiar cuando quieras en Ajustes.</p>
    </fieldset>
  );
}
