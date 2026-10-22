import { cn } from "@/ui/cn";
import type { SampleSlot } from "./sample-week";

interface MealSlotProps {
  slot: SampleSlot;
  meal: string;
  people: number;
  className?: string;
}

export function MealSlot({ slot, meal, people, className }: MealSlotProps) {
  if (!slot.recipe) {
    return (
      <button
        className={cn(
          "flex min-h-24 w-full items-center justify-center rounded-md border border-dashed border-hairline-strong",
          "text-sm text-muted transition-colors duration-(--dur-fast) ease-out hover:border-achiote hover:text-achiote",
          className,
        )}
      >
        + Agregar {meal.toLowerCase()}
      </button>
    );
  }

  return (
    <article
      className={cn(
        "group flex min-h-24 flex-col gap-2 rounded-md border border-hairline bg-surface p-3",
        "transition-[border-color,transform] duration-(--dur-fast) ease-out hover:-translate-y-px hover:border-hairline-strong",
        className,
      )}
    >
      <h3 className="text-[15px] leading-snug font-medium text-pretty">{slot.recipe}</h3>
      <p className="mt-auto text-xs text-muted">{people} personas</p>
      {slot.note && (
        <p className="border-t border-dashed border-hairline-strong pt-2 text-xs text-achiote-strong italic">
          “{slot.note}”
        </p>
      )}
    </article>
  );
}
