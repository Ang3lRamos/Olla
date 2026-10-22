import { Clock, Package, Plus, StickyNote, Users } from "lucide-react";
import { formatCop } from "@/domain/money";
import { RECIPE_CATEGORY_LABELS } from "@/domain/recipe-categories";
import { MEAL_LABELS } from "@/domain/week";
import { cn } from "@/ui/cn";
import type { CellView } from "../week-view";

/** Se levanta 1 px al pasar el mouse (se puede abrir) y se hunde levemente al presionar. */
const INTERACTIVE =
  "transition-[border-color,color,transform] duration-(--dur-fast) ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.99]";

interface MealCellProps {
  cell: CellView;
  dayLabel: string;
  onOpen: () => void;
  className?: string;
}

export function MealCell({ cell, dayLabel, onOpen, className }: MealCellProps) {
  const meal = MEAL_LABELS[cell.meal];
  const firstNote = cell.notes[0];

  if (!cell.recipe) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${dayLabel}, ${meal}: agregar receta${cell.notes.length ? " (tiene notas)" : ""}`}
        className={cn(
          "flex min-h-28 w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-hairline-strong",
          "text-sm text-muted hover:border-accent hover:text-ink",
          INTERACTIVE,
          className,
        )}
      >
        <span className="flex items-center gap-1.5">
          <Plus className="size-4" aria-hidden />
          Agregar
        </span>
        {firstNote && <span className="line-clamp-1 px-2 text-xs italic">“{firstNote.body}”</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${dayLabel}, ${meal}: ${cell.recipe.name}. Abrir`}
      className={cn(
        "flex min-h-28 w-full flex-col gap-1.5 rounded-md border border-hairline bg-surface p-3 text-left hover:border-hairline-strong",
        INTERACTIVE,
        className,
      )}
    >
      <span className="flex w-full items-center justify-between gap-2 text-xs text-muted">
        <span className="truncate">{RECIPE_CATEGORY_LABELS[cell.recipe.category]}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          {cell.isOverride && (
            <span className="flex items-center gap-0.5 font-medium text-ink tabular-nums">
              <Users className="size-3" aria-hidden />
              {cell.servings}
              <span className="sr-only"> personas</span>
            </span>
          )}
          {cell.recipe.usesPantry && (
            <span className="text-cilantro">
              <Package className="size-3.5" aria-hidden />
              <span className="sr-only">Usa algo de la despensa</span>
            </span>
          )}
        </span>
      </span>

      <span className="text-[15px] leading-snug font-medium text-pretty">{cell.recipe.name}</span>

      <span className="mt-auto flex w-full items-center justify-between gap-2 pt-1 text-xs">
        <span className="flex items-center gap-1 whitespace-nowrap text-muted tabular-nums">
          {cell.recipe.prepMinutes && (
            <>
              <Clock className="size-3" aria-hidden />
              {cell.recipe.prepMinutes} min
            </>
          )}
        </span>
        <span className="font-medium tabular-nums">{formatCop(cell.recipe.costCop)}</span>
      </span>

      {firstNote && (
        <span className="flex w-full items-start gap-1.5 border-t border-dashed border-hairline-strong pt-2 text-xs text-muted italic">
          <StickyNote className="mt-px size-3 shrink-0" aria-hidden />
          <span className="line-clamp-2">
            {firstNote.body}
            {cell.notes.length > 1 && ` (+${cell.notes.length - 1})`}
          </span>
        </span>
      )}
    </button>
  );
}
