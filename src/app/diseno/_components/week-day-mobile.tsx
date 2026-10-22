"use client";

import { useState } from "react";
import { formatCop } from "@/domain/money";
import { cn } from "@/ui/cn";
import { MealSlot } from "./meal-slot";
import { MEALS, SAMPLE_WEEK, dayCost } from "./sample-week";

const todayIndex = SAMPLE_WEEK.findIndex((day) => day.isToday);

/** Vista de celular: un día a la vez con selector de días. */
export function WeekDayMobile() {
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const day = SAMPLE_WEEK[selectedDay]!;

  return (
    <div className="flex flex-col gap-4 md:hidden">
      <nav aria-label="Días de la semana" className="-mx-4 flex justify-between gap-1 overflow-x-auto px-4">
        {SAMPLE_WEEK.map((item, index) => (
          <button
            key={item.short}
            onClick={() => setSelectedDay(index)}
            aria-pressed={index === selectedDay}
            className={cn(
              "flex min-w-11 flex-col items-center rounded-md px-1.5 py-1.5 transition-colors duration-(--dur-fast) ease-out",
              index === selectedDay ? "bg-ink text-canvas" : "text-muted hover:bg-sunken",
            )}
          >
            <span className="letrero text-sm">{item.short}</span>
            <span className={cn("text-lg font-semibold tabular-nums", item.isToday && "marcador")}>
              {item.date}
            </span>
          </button>
        ))}
      </nav>

      <div key={selectedDay} className="flex animate-rise flex-col gap-3">
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-1">
          <h3 className="letrero text-2xl">{day.long}</h3>
          <span className="text-sm text-muted">
            Costo del día{" "}
            <span className="font-semibold text-ink tabular-nums">{formatCop(dayCost(day))}</span>
          </span>
        </div>
        {day.slots.map((slot, index) => (
          <div key={MEALS[index]} className="flex flex-col gap-1">
            <p className="letrero text-xs text-muted">{MEALS[index]}</p>
            <MealSlot slot={slot} meal={MEALS[index]!} className="min-h-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
