"use client";

import { weekDates, weekdayLabels, type IsoDate } from "@/domain/week";
import { cn } from "@/ui/cn";
import { Select } from "@/ui/select";
import type { DayRange } from "../shopping-view";

interface DayRangePickerProps {
  weekStart: IsoDate;
  value: DayRange | undefined;
  onChange: (range: DayRange | undefined) => void;
}

const ALL_WEEK: DayRange = { from: 0, to: 6 };

/** Para qué días se merca: toda la semana o un tramo ("de lunes a miércoles"). */
export function DayRangePicker({ weekStart, value, onChange }: DayRangePickerProps) {
  const options = weekDates(weekStart).map((date, day) => {
    const { long, dayOfMonth } = weekdayLabels(date);
    return { value: String(day), label: `${long} ${dayOfMonth}` };
  });
  const range = value ?? ALL_WEEK;
  const setFrom = (from: number) => onChange({ from, to: Math.max(from, range.to) });
  const setTo = (to: number) => onChange({ from: Math.min(range.from, to), to });

  return (
    <div className="flex flex-col gap-3 rounded-md border border-hairline p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">¿Para qué días vas a mercar?</p>
        <div
          role="radiogroup"
          aria-label="Días del mercado"
          className="inline-flex rounded-md border border-hairline bg-sunken p-0.5"
        >
          {[
            { label: "Toda la semana", active: !value, select: () => onChange(undefined) },
            {
              label: "Algunos días",
              active: Boolean(value),
              select: () => onChange(value ?? { from: 0, to: 2 }),
            },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={option.active}
              onClick={option.select}
              className={cn(
                "h-7 rounded-sm px-3 text-sm transition-colors duration-(--dur-fast) ease-out",
                option.active ? "bg-surface text-ink shadow-raised" : "text-muted hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {value && (
        <div className="grid animate-rise grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Desde</span>
            <Select
              aria-label="Desde qué día"
              value={String(range.from)}
              options={options}
              onValueChange={(day) => setFrom(Number(day))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Hasta</span>
            <Select
              aria-label="Hasta qué día"
              value={String(range.to)}
              options={options}
              onValueChange={(day) => setTo(Number(day))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
