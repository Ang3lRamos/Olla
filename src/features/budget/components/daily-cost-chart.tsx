"use client";

import { useId, useState } from "react";
import { formatCop } from "@/domain/money";
import { cn } from "@/ui/cn";

export interface DayCost {
  short: string;
  long: string;
  costCop: number;
}

interface DailyCostChartProps {
  days: DayCost[];
  /** Presupuesto semanal repartido en 7 días; se dibuja como línea de referencia. */
  dailyCapCop: number | null;
}

const PLOT_HEIGHT_PX = 168;
const COMPACT = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });

/** Techo "bonito" del eje (1, 2 o 5 × 10ⁿ) para que las marcas sean números redondos. */
function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((candidate) => candidate * magnitude >= value) ?? 10;
  return step * magnitude;
}

export function DailyCostChart({ days, dailyCapCop }: DailyCostChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  const max = niceCeiling(Math.max(...days.map((day) => day.costCop), dailyCapCop ?? 0));
  const peak = days.reduce(
    (best, day, index) => (day.costCop > (days[best]?.costCop ?? 0) ? index : best),
    0,
  );
  const ticks = [max, max / 2, 0];
  const y = (value: number) => (value / max) * PLOT_HEIGHT_PX;

  return (
    <figure aria-labelledby={titleId} className="flex flex-col gap-3">
      <figcaption id={titleId} className="flex flex-col gap-0.5">
        <span className="font-medium">Costo por día</span>
        <span className="text-sm text-muted">Lo que vale cocinar cada día con tus precios.</span>
      </figcaption>

      <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2 pt-3">
        <div
          className="relative text-right text-xs text-muted tabular-nums"
          style={{ height: PLOT_HEIGHT_PX }}
          aria-hidden
        >
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ bottom: y(tick) - 6 }}>
              {tick === 0 ? "0" : `$${COMPACT.format(tick)}`}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative" style={{ height: PLOT_HEIGHT_PX }}>
            {ticks.map((tick) => (
              <span
                key={tick}
                aria-hidden
                className="absolute inset-x-0 h-px bg-hairline"
                style={{ bottom: y(tick) }}
              />
            ))}
            {dailyCapCop !== null && (
              <span
                aria-hidden
                className="absolute inset-x-0 h-px bg-muted"
                style={{ bottom: y(dailyCapCop) }}
              >
                <span className="absolute right-0 bottom-1 rounded-sm bg-surface px-1 text-xs text-muted">
                  Tope diario {formatCop(dailyCapCop)}
                </span>
              </span>
            )}

            <ul className="absolute inset-0 grid grid-cols-7">
              {days.map((day, index) => (
                <li key={day.long} className="relative flex justify-center">
                  <button
                    type="button"
                    aria-label={`${day.long}: ${formatCop(day.costCop)}`}
                    onPointerEnter={() => setActive(index)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    className="absolute inset-y-0 w-full max-w-14 rounded-sm"
                  >
                    {/* Altura real (no scaleY) para que el redondeo de 4 px no se deforme. */}
                    <span
                      className={cn(
                        "absolute bottom-0 left-1/2 w-6 -translate-x-1/2 rounded-t-[4px] bg-chart",
                        "transition-opacity duration-(--dur-fast) ease-out",
                        active === index && "opacity-80",
                      )}
                      style={{ height: y(day.costCop) }}
                    />
                  </button>
                  {index === peak && day.costCop > 0 && active !== index && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute text-xs font-medium tabular-nums"
                      style={{ bottom: y(day.costCop) + 4 }}
                    >
                      {formatCop(day.costCop)}
                    </span>
                  )}
                  {active === index && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute z-10 flex animate-rise flex-col items-center rounded-md border border-hairline bg-surface px-2.5 py-1.5 whitespace-nowrap shadow-raised"
                      style={{ bottom: y(day.costCop) + 24 }}
                    >
                      <span className="font-semibold tabular-nums">{formatCop(day.costCop)}</span>
                      <span className="text-xs text-muted">{day.long}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <ul className="grid grid-cols-7 text-center text-xs text-muted" aria-hidden>
            {days.map((day) => (
              <li key={day.long}>{day.short}</li>
            ))}
          </ul>
        </div>
      </div>

      <details className="text-sm">
        <summary className="w-fit cursor-pointer text-muted hover:text-ink">Ver como tabla</summary>
        <table className="mt-2 w-full max-w-sm text-left tabular-nums">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 font-normal">Día</th>
              <th className="py-1 text-right font-normal">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {days.map((day) => (
              <tr key={day.long}>
                <td className="py-1.5">{day.long}</td>
                <td className="py-1.5 text-right">{formatCop(day.costCop)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
