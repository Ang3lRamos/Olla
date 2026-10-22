"use client";

import { useRef, useState, type TouchEvent } from "react";
import { formatCop } from "@/domain/money";
import { cn } from "@/ui/cn";
import { MealSlot } from "./meal-slot";
import { MEALS, SAMPLE_WEEK, dayCost } from "./sample-week";

const todayIndex = SAMPLE_WEEK.findIndex((day) => day.isToday);
const SWIPE_THRESHOLD_PX = 50;
const STAGGER_MS = 40;

/** Vista de celular: un día a la vez, con selector y deslizamiento entre días. */
export function WeekDayMobile() {
  const [selection, setSelection] = useState({ index: todayIndex, direction: 0 });
  const touchStartX = useRef<number | null>(null);
  const day = SAMPLE_WEEK[selection.index]!;

  const selectDay = (index: number) => {
    if (index < 0 || index >= SAMPLE_WEEK.length || index === selection.index) return;
    setSelection({ index, direction: Math.sign(index - selection.index) });
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0]!.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) selectDay(selection.index + (deltaX < 0 ? 1 : -1));
  };

  // El contenido entra desde el lado hacia el que se navega, para que se entienda a dónde fue.
  const enterAnimation =
    selection.direction > 0
      ? "animate-enter-from-right"
      : selection.direction < 0
        ? "animate-enter-from-left"
        : "animate-rise";

  return (
    <div className="flex flex-col gap-4 md:hidden">
      <nav aria-label="Días de la semana" className="relative grid grid-cols-7">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[calc(100%/7)] rounded-md bg-ink transition-transform duration-(--dur-base) ease-out"
          style={{ transform: `translateX(${selection.index * 100}%)` }}
        />
        {SAMPLE_WEEK.map((item, index) => (
          <button
            key={item.short}
            type="button"
            onClick={() => selectDay(index)}
            aria-pressed={index === selection.index}
            aria-label={`${item.long} ${item.date}${item.isToday ? ", hoy" : ""}`}
            className={cn(
              "relative flex flex-col items-center rounded-md py-1.5 transition-colors duration-(--dur-fast) ease-out",
              index === selection.index ? "text-canvas" : "text-muted active:bg-sunken",
            )}
          >
            <span className="letrero text-sm">{item.short}</span>
            <span className={cn("text-lg font-semibold tabular-nums", item.isToday && "marcador")}>
              {item.date}
            </span>
          </button>
        ))}
      </nav>

      <section
        key={selection.index}
        aria-label={day.long}
        className="flex touch-pan-y flex-col gap-3"
        onTouchStart={(event) => (touchStartX.current = event.touches[0]!.clientX)}
        onTouchEnd={onTouchEnd}
      >
        <div className={cn("flex items-baseline justify-between border-b-2 border-ink pb-1", enterAnimation)}>
          <h3 className="letrero text-2xl">{day.long}</h3>
          <span className="text-sm text-muted">
            Costo del día{" "}
            <span className="font-semibold text-ink tabular-nums">{formatCop(dayCost(day))}</span>
          </span>
        </div>
        {day.slots.map((slot, index) => (
          <div
            key={MEALS[index]}
            className={cn("flex flex-col gap-1", enterAnimation)}
            style={{ animationDelay: `${(index + 1) * STAGGER_MS}ms` }}
          >
            <p className="letrero text-xs text-muted">{MEALS[index]}</p>
            <MealSlot slot={slot} meal={MEALS[index]!} className="min-h-0" />
          </div>
        ))}
      </section>
    </div>
  );
}
