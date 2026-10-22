"use client";

import { ArrowRight } from "lucide-react";
import { formatCop } from "@/domain/money";
import { MEAL_LABELS } from "@/domain/week";
import { Checkbox } from "@/ui/checkbox";
import { cn } from "@/ui/cn";
import type { ProposedChange } from "../sanitize";

const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface ChangePreviewProps {
  changes: ProposedChange[];
  selected: Set<number>;
  onToggle: (index: number) => void;
  recipeName: (recipeId: string | null) => string;
  currentRecipeId: (day: number, meal: ProposedChange["meal"]) => string | null;
  marketNowCop: number;
  marketAfterCop: number;
}

/** Vista previa "antes → después" de cada casilla; nada se guarda hasta aplicar. */
export function ChangePreview({
  changes,
  selected,
  onToggle,
  recipeName,
  currentRecipeId,
  marketNowCop,
  marketAfterCop,
}: ChangePreviewProps) {
  const difference = marketAfterCop - marketNowCop;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {changes.map((change, index) => {
          const before = currentRecipeId(change.day, change.meal);
          return (
            <li
              key={`${change.day}-${change.meal}`}
              className={cn(
                "animate-rise py-2.5 transition-opacity duration-(--dur-base) ease-out",
                !selected.has(index) && "opacity-50",
              )}
              style={{ animationDelay: index < 6 ? `${index * 40}ms` : undefined }}
            >
              <Checkbox
                checked={selected.has(index)}
                onChange={() => onToggle(index)}
                label={
                  <span className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted">
                      {DAY_SHORT[change.day]} · {MEAL_LABELS[change.meal]}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[15px]">
                      {before && (
                        <>
                          <span className="text-muted">{recipeName(before)}</span>
                          <ArrowRight className="size-3.5 text-muted" aria-label="cambia a" />
                        </>
                      )}
                      <span className="font-medium">
                        {change.recipeId ? recipeName(change.recipeId) : "Dejar vacío"}
                      </span>
                    </span>
                    {change.reason && <span className="text-xs text-muted">{change.reason}</span>}
                  </span>
                }
              />
            </li>
          );
        })}
      </ul>

      <p className="flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-sunken px-3 py-2.5 text-sm">
        <span className="text-muted">Mercado de la semana</span>
        <span className="tabular-nums">
          {formatCop(marketNowCop)} → <span className="font-semibold">{formatCop(marketAfterCop)}</span>{" "}
          <span className={cn(difference > 0 ? "text-danger" : "text-cilantro")}>
            ({difference > 0 ? "+" : "−"}
            {formatCop(Math.abs(difference))})
          </span>
        </span>
      </p>
    </div>
  );
}
