import { StickyNote } from "lucide-react";
import { formatCop } from "@/domain/money";
import { MEAL_LABELS, MEALS, type Meal } from "@/domain/week";
import { cn } from "@/ui/cn";
import type { DayView } from "../week-view";
import { MealCell } from "./meal-cell";

interface WeekGridProps {
  days: DayView[];
  dayCosts: number[];
  onOpenCell: (day: number, meal: Meal) => void;
  onOpenDayNotes: (day: number) => void;
}

/** Escritorio: cada día es una columna en subgrid para que las filas de comidas se alineen. */
export function WeekGrid({ days, dayCosts, onOpenCell, onOpenDayNotes }: WeekGridProps) {
  const maxDayCost = Math.max(...dayCosts, 1);

  return (
    <div className="hidden grid-cols-[5.5rem_repeat(7,minmax(0,1fr))] grid-rows-[auto_repeat(3,auto)_auto] gap-x-1.5 md:grid">
      <div className="row-span-5 grid grid-rows-subgrid gap-y-2">
        <div />
        {MEALS.map((meal) => (
          <p key={meal} className="pt-3 letrero text-xs text-muted">
            {MEAL_LABELS[meal]}
          </p>
        ))}
        <p className="pt-1 text-xs text-muted">Costo del día</p>
      </div>

      {days.map((day) => (
        <section
          key={day.date}
          aria-label={`${day.long} ${day.dayOfMonth}`}
          className={cn(
            "row-span-5 grid grid-rows-subgrid gap-y-2 rounded-md p-1.5",
            day.isToday && "bg-sunken",
          )}
        >
          <header className="flex items-baseline justify-between border-b-2 border-ink px-0.5 pb-1">
            <span className="flex items-baseline gap-1.5">
              <span className="letrero text-2xl">{day.short}</span>
              <span className={cn("text-sm text-muted tabular-nums", day.isToday && "marcador text-ink")}>
                {day.dayOfMonth}
              </span>
            </span>
            {day.isToday && <span className="letrero text-xs">Hoy</span>}
          </header>

          {day.cells.map((cell) => (
            <MealCell
              key={cell.meal}
              cell={cell}
              dayLabel={day.long}
              onOpen={() => onOpenCell(day.day, cell.meal)}
            />
          ))}

          <footer className="flex flex-col gap-1.5 px-0.5 pt-1">
            <span className="flex items-center justify-between gap-1">
              <span className="text-sm font-medium tabular-nums">{formatCop(dayCosts[day.day] ?? 0)}</span>
              <button
                type="button"
                onClick={() => onOpenDayNotes(day.day)}
                aria-label={`Notas del ${day.long.toLowerCase()}${day.dayNotes.length ? `: ${day.dayNotes.length}` : ""}`}
                className={cn(
                  "flex items-center gap-0.5 rounded-sm px-1 py-0.5 text-xs transition-colors duration-(--dur-fast) ease-out hover:bg-hairline",
                  day.dayNotes.length ? "text-ink" : "text-muted",
                )}
              >
                <StickyNote className="size-3.5" aria-hidden />
                {day.dayNotes.length > 0 && <span className="tabular-nums">{day.dayNotes.length}</span>}
              </button>
            </span>
            <span className="h-1 overflow-hidden rounded-full bg-hairline" aria-hidden>
              <span
                className="block h-full origin-left rounded-full bg-chart transition-transform duration-(--dur-slow) ease-out"
                style={{ transform: `scaleX(${(dayCosts[day.day] ?? 0) / maxDayCost})` }}
              />
            </span>
          </footer>
        </section>
      ))}
    </div>
  );
}
