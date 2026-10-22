import { Clock, Package, Plus, StickyNote } from "lucide-react";
import { formatCop } from "@/domain/money";
import { cn } from "@/ui/cn";
import type { SampleSlot } from "./sample-week";

interface MealSlotProps {
  slot: SampleSlot | null;
  meal: string;
  className?: string;
}

/** Hover levanta la casilla 1 px (se puede abrir); al presionar se hunde levemente como respuesta. */
const INTERACTIVE =
  "transition-[border-color,color,transform] duration-(--dur-fast) ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.99]";

export function MealSlot({ slot, meal, className }: MealSlotProps) {
  if (!slot) {
    return (
      <button
        type="button"
        className={cn(
          "flex min-h-28 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-hairline-strong",
          "text-sm text-muted hover:border-achiote hover:text-achiote",
          INTERACTIVE,
          className,
        )}
      >
        <Plus className="size-4" aria-hidden />
        Agregar {meal.toLowerCase()}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={`${meal}: ${slot.recipe}. Abrir detalle`}
      className={cn(
        "flex min-h-28 w-full flex-col gap-1.5 rounded-md border border-hairline bg-surface p-3 text-left",
        "hover:border-hairline-strong",
        INTERACTIVE,
        className,
      )}
    >
      <span className="flex w-full items-center justify-between gap-2 text-xs text-muted">
        <span className="truncate">{slot.category}</span>
        {slot.usesPantry && (
          <span className="flex items-center text-cilantro">
            <Package className="size-3.5 shrink-0" aria-hidden />
            <span className="sr-only">Usa ingredientes de la despensa</span>
          </span>
        )}
      </span>

      <span className="text-[15px] leading-snug font-medium text-pretty">{slot.recipe}</span>

      <span className="mt-auto flex w-full items-center justify-between gap-2 pt-1 text-xs">
        <span className="flex items-center gap-1 whitespace-nowrap text-muted tabular-nums">
          <Clock className="size-3" aria-hidden />
          {slot.minutes} min
        </span>
        <span className="font-medium tabular-nums">{formatCop(slot.costCop)}</span>
      </span>

      {slot.note && (
        <span className="flex w-full items-start gap-1.5 border-t border-dashed border-hairline-strong pt-2 text-xs text-achiote">
          <StickyNote className="mt-px size-3 shrink-0" aria-hidden />
          {slot.note}
        </span>
      )}
    </button>
  );
}
