"use client";

import { useState } from "react";
import { formatCop } from "@/domain/money";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { MealSlot } from "./meal-slot";
import { MEALS, SAMPLE_WEEK } from "./sample-week";

const PEOPLE = 4;
const todayIndex = SAMPLE_WEEK.findIndex((day) => day.isToday);

export function WeekPreview() {
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const day = SAMPLE_WEEK[selectedDay]!;
  const weekCost = SAMPLE_WEEK.reduce((sum, item) => sum + item.costCop, 0);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted">Semana del 19 al 25 de octubre</p>
          <h2 className="font-display text-title font-semibold md:text-display">Lo que vamos a comer</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm">
            <span className="text-muted">Mercado estimado </span>
            <span className="font-semibold tabular-nums">{formatCop(weekCost)}</span>
          </p>
          <Button variant="secondary" size="sm">
            {PEOPLE} personas
          </Button>
          <Button size="sm">Pedir al asistente</Button>
        </div>
      </header>

      <nav aria-label="Días de la semana" className="-mx-4 flex gap-1 overflow-x-auto px-4 md:hidden">
        {SAMPLE_WEEK.map((item, index) => (
          <button
            key={item.short}
            onClick={() => setSelectedDay(index)}
            aria-pressed={index === selectedDay}
            className={cn(
              "flex min-w-12 flex-col items-center rounded-md px-2 py-1.5 transition-colors duration-(--dur-fast) ease-out",
              index === selectedDay ? "bg-ink text-paper" : "text-muted hover:bg-sunken",
            )}
          >
            <span className="letrero text-sm">{item.short}</span>
            <span className={cn("text-lg font-semibold tabular-nums", item.isToday && "marcador")}>
              {item.date}
            </span>
          </button>
        ))}
      </nav>

      <div key={selectedDay} className="flex animate-rise flex-col gap-2 md:hidden">
        {day.slots.map((slot, index) => (
          <div key={MEALS[index]} className="flex flex-col gap-1">
            <p className="letrero text-xs text-muted">{MEALS[index]}</p>
            <MealSlot slot={slot} meal={MEALS[index]!} people={PEOPLE} />
          </div>
        ))}
        <p className="pt-2 text-right text-sm text-muted">
          Costo del día <span className="font-semibold text-ink tabular-nums">{formatCop(day.costCop)}</span>
        </p>
      </div>

      <div className="hidden grid-cols-[5.5rem_repeat(7,minmax(0,1fr))] gap-x-2 gap-y-2 md:grid">
        <div />
        {SAMPLE_WEEK.map((item) => (
          <div key={item.short} className="flex items-baseline gap-1.5 border-b-2 border-ink pb-1">
            <span className="letrero text-2xl">{item.short}</span>
            <span className={cn("text-sm text-muted tabular-nums", item.isToday && "marcador text-ink")}>
              {item.date}
            </span>
          </div>
        ))}
        {MEALS.map((meal, mealIndex) => (
          <div key={meal} className="contents">
            <p className="pt-3 letrero text-xs text-muted">{meal}</p>
            {SAMPLE_WEEK.map((item) => (
              <MealSlot key={item.short} slot={item.slots[mealIndex]!} meal={meal} people={PEOPLE} />
            ))}
          </div>
        ))}
        <p className="pt-2 text-xs text-muted">Por día</p>
        {SAMPLE_WEEK.map((item) => (
          <p key={item.short} className="pt-2 text-sm font-medium tabular-nums">
            {formatCop(item.costCop)}
          </p>
        ))}
      </div>
    </section>
  );
}
