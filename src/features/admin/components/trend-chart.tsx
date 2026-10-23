"use client";

import { useId, useState } from "react";
import { formatCop } from "@/domain/money";
import { niceCeiling } from "@/ui/chart-scale";
import { cn } from "@/ui/cn";
import type { SeriesPoint } from "../metrics";

const PLOT_HEIGHT_PX = 144;
const COMPACT = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });
const COUNT = new Intl.NumberFormat("es-CO");

interface TrendChartProps {
  title: string;
  subtitle: string;
  points: SeriesPoint[];
  unit: "count" | "cop";
}

/** Una serie en barras, con eje discreto, tooltip al pasar y la tabla para quien no ve la gráfica. */
export function TrendChart({ title, subtitle, points, unit }: TrendChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  const format = (value: number) => (unit === "cop" ? formatCop(value) : COUNT.format(value));
  const max = niceCeiling(Math.max(...points.map((point) => point.value)));
  const y = (value: number) => (value / max) * PLOT_HEIGHT_PX;
  // Con muchas barras se rotula una de cada cinco para que no se monten.
  const labelEvery = points.length > 12 ? 5 : 1;
  const ticks = [max, max / 2, 0];
  const total = points.reduce((sum, point) => sum + point.value, 0);

  return (
    <figure aria-labelledby={titleId} className="flex flex-col gap-3 rounded-md border border-hairline p-4">
      <figcaption id={titleId} className="flex items-baseline justify-between gap-3">
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">{title}</span>
          <span className="text-sm text-muted">{subtitle}</span>
        </span>
        <span className="font-display text-xl font-semibold tabular-nums">{format(total)}</span>
      </figcaption>

      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-2 pt-3">
        <div
          className="relative text-right text-xs text-muted tabular-nums"
          style={{ height: PLOT_HEIGHT_PX }}
          aria-hidden
        >
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ bottom: y(tick) - 6 }}>
              {unit === "cop" && tick > 0 ? `$${COMPACT.format(tick)}` : COMPACT.format(tick)}
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
            <ul
              className="absolute inset-0 grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
            >
              {points.map((point, index) => (
                <li key={point.key} className="relative flex justify-center">
                  <button
                    type="button"
                    aria-label={`${point.label}: ${format(point.value)}`}
                    onPointerEnter={() => setActive(index)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    className="absolute inset-y-0 w-full rounded-sm"
                  >
                    <span
                      className={cn(
                        "absolute bottom-0 left-1/2 w-full max-w-6 -translate-x-1/2 rounded-t-[4px] bg-chart",
                        "transition-opacity duration-(--dur-fast) ease-out",
                        active === index && "opacity-80",
                      )}
                      style={{ height: point.value > 0 ? Math.max(y(point.value), 2) : 0 }}
                    />
                  </button>
                  {active === index && (
                    <span
                      role="tooltip"
                      className={cn(
                        "pointer-events-none absolute z-10 flex animate-rise flex-col items-center rounded-md border border-hairline bg-surface px-2.5 py-1.5 whitespace-nowrap shadow-raised",
                        index < 3 && "left-0",
                        index > points.length - 4 && "right-0",
                      )}
                      style={{ bottom: y(point.value) + 8 }}
                    >
                      <span className="font-semibold tabular-nums">{format(point.value)}</span>
                      <span className="text-xs text-muted">{point.label}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <ul
            className="grid text-center text-xs text-muted"
            style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
            aria-hidden
          >
            {points.map((point, index) => (
              <li key={point.key} className="overflow-visible whitespace-nowrap">
                {(points.length - 1 - index) % labelEvery === 0 ? point.label : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <details className="text-sm">
        <summary className="w-fit cursor-pointer text-muted hover:text-ink">Ver como tabla</summary>
        <table className="mt-2 w-full max-w-sm text-left tabular-nums">
          <tbody className="divide-y divide-hairline">
            {points.map((point) => (
              <tr key={point.key}>
                <td className="py-1">{point.label}</td>
                <td className="py-1 text-right">{format(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
