import { formatCop } from "@/domain/money";
import { cn } from "@/ui/cn";
import { MealSlot } from "./meal-slot";
import { MEALS, SAMPLE_WEEK, dayCost } from "./sample-week";

const maxDayCost = Math.max(...SAMPLE_WEEK.map(dayCost));

/** Vista de escritorio: cada día es una columna en subgrid para que las filas de comidas se alineen. */
export function WeekGrid() {
  return (
    <div className="hidden grid-cols-[5.5rem_repeat(7,minmax(0,1fr))] grid-rows-[auto_repeat(3,auto)_auto] gap-x-1.5 md:grid">
      <div className="row-span-5 grid grid-rows-subgrid gap-y-2">
        <div />
        {MEALS.map((meal) => (
          <p key={meal} className="pt-3 letrero text-xs text-muted">
            {meal}
          </p>
        ))}
        <p className="pt-1 text-xs text-muted">Costo del día</p>
      </div>

      {SAMPLE_WEEK.map((day) => (
        <section
          key={day.short}
          aria-label={day.long}
          className={cn(
            "row-span-5 grid grid-rows-subgrid gap-y-2 rounded-md p-1.5",
            day.isToday && "bg-sunken",
          )}
        >
          <header className="flex items-baseline justify-between border-b-2 border-ink px-0.5 pb-1">
            <span className="flex items-baseline gap-1.5">
              <span className="letrero text-2xl">{day.short}</span>
              <span className={cn("text-sm text-muted tabular-nums", day.isToday && "marcador text-ink")}>
                {day.date}
              </span>
            </span>
            {day.isToday && <span className="letrero text-xs text-achiote">Hoy</span>}
          </header>

          {day.slots.map((slot, index) => (
            <MealSlot key={MEALS[index]} slot={slot} meal={MEALS[index]!} />
          ))}

          <footer className="flex flex-col gap-1.5 px-0.5 pt-1">
            <span className="text-sm font-medium tabular-nums">{formatCop(dayCost(day))}</span>
            <span className="h-1 overflow-hidden rounded-full bg-hairline" aria-hidden>
              <span
                className="block h-full origin-left rounded-full bg-ink"
                style={{ transform: `scaleX(${dayCost(day) / maxDayCost})` }}
              />
            </span>
          </footer>
        </section>
      ))}
    </div>
  );
}
