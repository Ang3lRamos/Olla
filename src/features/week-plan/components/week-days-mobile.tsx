"use client";

import { StickyNote } from "lucide-react";
import { useRef, useState, type TouchEvent } from "react";
import { formatCop } from "@/domain/money";
import { MEAL_LABELS, type Meal } from "@/domain/week";
import { cn } from "@/ui/cn";
import type { DayView } from "../week-view";
import { MealCell } from "./meal-cell";
import { DayNutritionLine, type DayNutrition } from "./day-nutrition";

const SWIPE_THRESHOLD_PX = 50;
const STAGGER_MS = 40;

interface WeekDaysMobileProps {
  days: DayView[];
  dayCosts: number[];
  dayNutrition: DayNutrition[] | null;
  initialDay: number;
  onOpenCell: (day: number, meal: Meal) => void;
  onOpenDayNotes: (day: number) => void;
}

/** Celular: un día a la vez, con selector y deslizamiento entre días. */
export function WeekDaysMobile({
  days,
  dayCosts,
  dayNutrition,
  initialDay,
  onOpenCell,
  onOpenDayNotes,
}: WeekDaysMobileProps) {
  const [selection, setSelection] = useState({ index: initialDay, direction: 0 });
  const touchStartX = useRef<number | null>(null);
  const day = days[selection.index]!;

  const selectDay = (index: number) => {
    if (index < 0 || index >= days.length || index === selection.index) return;
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
    <div data-tour="week-days" className="flex flex-col gap-4 md:hidden">
      <nav aria-label="Días de la semana" className="relative grid grid-cols-7">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[calc(100%/7)] rounded-md bg-ink transition-transform duration-(--dur-base) ease-out"
          style={{ transform: `translateX(${selection.index * 100}%)` }}
        />
        {days.map((item, index) => (
          <button
            key={item.date}
            type="button"
            onClick={() => selectDay(index)}
            aria-pressed={index === selection.index}
            className={cn(
              "relative flex flex-col items-center rounded-md py-1.5 transition-colors duration-(--dur-fast) ease-out",
              index === selection.index ? "text-canvas" : "text-muted active:bg-sunken",
            )}
          >
            <span className="letrero text-sm" aria-hidden>
              {item.short}
            </span>
            <span className="sr-only">{item.long}</span>
            <span className={cn("text-lg font-semibold tabular-nums", item.isToday && "marcador")}>
              {item.dayOfMonth}
            </span>
            {item.isToday && <span className="sr-only">, hoy</span>}
          </button>
        ))}
      </nav>

      <section
        key={day.date}
        aria-label={`${day.long} ${day.dayOfMonth}`}
        className="flex touch-pan-y flex-col gap-3"
        onTouchStart={(event) => (touchStartX.current = event.touches[0]!.clientX)}
        onTouchEnd={onTouchEnd}
      >
        <div className={cn("flex items-baseline justify-between border-b-2 border-ink pb-1", enterAnimation)}>
          <h3 className="letrero text-2xl">{day.long}</h3>
          <span className="flex flex-col items-end">
            <span className="text-sm text-muted">
              Costo del día{" "}
              <span className="font-semibold text-ink tabular-nums">{formatCop(dayCosts[day.day] ?? 0)}</span>
            </span>
            {dayNutrition && <DayNutritionLine nutrition={dayNutrition[day.day]} />}
          </span>
        </div>
        {day.cells.map((cell, index) => (
          <div
            key={cell.meal}
            className={cn("flex flex-col gap-1", enterAnimation)}
            style={{ animationDelay: `${(index + 1) * STAGGER_MS}ms` }}
          >
            <p className="letrero text-xs text-muted">{MEAL_LABELS[cell.meal]}</p>
            <MealCell
              cell={cell}
              dayLabel={day.long}
              onOpen={() => onOpenCell(day.day, cell.meal)}
              className="min-h-0"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onOpenDayNotes(day.day)}
          className="flex items-center gap-2 rounded-md border border-dashed border-hairline-strong px-3 py-2.5 text-sm text-muted transition-colors duration-(--dur-fast) ease-out active:bg-sunken"
        >
          <StickyNote className="size-4" aria-hidden />
          {day.dayNotes.length
            ? `${day.dayNotes.length} ${day.dayNotes.length === 1 ? "nota" : "notas"} del día`
            : "Agregar nota del día"}
        </button>
      </section>
    </div>
  );
}
