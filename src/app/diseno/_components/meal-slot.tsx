import { Clock, Package, Plus, StickyNote } from "lucide-react";
import { formatCop } from "@/domain/money";
import { cn } from "@/ui/cn";
import type { SampleSlot } from "./sample-week";

interface MealSlotProps {
  slot: SampleSlot | null;
  meal: string;
  className?: string;
}

export function MealSlot({ slot, meal, className }: MealSlotProps) {
  if (!slot) {
    return (
      <button
        className={cn(
          "flex min-h-28 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-hairline-strong",
          "text-sm text-muted transition-colors duration-(--dur-fast) ease-out hover:border-achiote hover:text-achiote",
          className,
        )}
      >
        <Plus className="size-4" aria-hidden />
        Agregar {meal.toLowerCase()}
      </button>
    );
  }

  return (
    <article
      className={cn(
        "flex min-h-28 cursor-pointer flex-col gap-1.5 rounded-md border border-hairline bg-surface p-3",
        "transition-[border-color,transform] duration-(--dur-fast) ease-out hover:-translate-y-px hover:border-hairline-strong",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span className="truncate">{slot.category}</span>
        {slot.usesPantry && (
          <Package className="size-3.5 shrink-0 text-cilantro" aria-label="Usa ingredientes de la despensa" />
        )}
      </div>

      <h3 className="text-[15px] leading-snug font-medium text-pretty">{slot.recipe}</h3>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs">
        <span className="flex items-center gap-1 whitespace-nowrap text-muted tabular-nums">
          <Clock className="size-3" aria-hidden />
          {slot.minutes} min
        </span>
        <span className="font-medium tabular-nums">{formatCop(slot.costCop)}</span>
      </div>

      {slot.note && (
        <p className="flex items-start gap-1.5 border-t border-dashed border-hairline-strong pt-2 text-xs text-achiote">
          <StickyNote className="mt-px size-3 shrink-0" aria-hidden />
          {slot.note}
        </p>
      )}
    </article>
  );
}
