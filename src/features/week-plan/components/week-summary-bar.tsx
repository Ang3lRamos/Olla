import Link from "next/link";
import type { ReactNode } from "react";
import { formatCop } from "@/domain/money";
import type { WeekSummary } from "@/domain/week-plan";
import { cn } from "@/ui/cn";

/** A partir de este uso del presupuesto la barra pasa a color de advertencia. */
const BUDGET_WARNING_RATIO = 0.9;

function Stat({ label, value, detail }: { label: string; value: string; detail?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 pr-4 md:border-l md:border-hairline md:pl-4 md:first:border-l-0 md:first:pl-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display text-xl font-semibold tabular-nums">{value}</dd>
      {detail && <dd className="text-xs text-muted">{detail}</dd>}
    </div>
  );
}

interface WeekSummaryBarProps {
  weekStart: string;
  summary: WeekSummary;
  weeklyBudgetCop: number | null;
}

export function WeekSummaryBar({ weekStart, summary, weeklyBudgetCop }: WeekSummaryBarProps) {
  const missing = summary.totalMeals - summary.plannedMeals;
  const market = summary.market.totalCop;
  const used = weeklyBudgetCop ? Math.min(market / weeklyBudgetCop, 1) : 0;

  return (
    <dl className="grid grid-cols-2 border-y border-hairline md:grid-cols-4">
      <Stat
        label="Comidas planeadas"
        value={`${summary.plannedMeals} de ${summary.totalMeals}`}
        detail={missing === 0 ? "Semana completa" : `Faltan ${missing}`}
      />
      <Stat
        label="Mercado estimado"
        value={formatCop(market)}
        detail={
          <Link
            href={`/mercado?semana=${weekStart}`}
            className="underline decoration-hairline-strong underline-offset-4 hover:text-ink"
          >
            {summary.market.unpricedIngredientIds.length > 0
              ? `Ver lista · ${summary.market.unpricedIngredientIds.length} sin precio`
              : "Ver lista de mercado"}
          </Link>
        }
      />
      <Stat
        label="Promedio por día"
        value={formatCop(summary.averagePerPlannedDayCop)}
        detail="Días con comidas"
      />
      {weeklyBudgetCop ? (
        <Stat
          label="Presupuesto semanal"
          value={formatCop(weeklyBudgetCop - market)}
          detail={
            <span className="flex flex-col gap-1.5">
              <span>
                {market > weeklyBudgetCop ? "por encima" : "disponibles"} de {formatCop(weeklyBudgetCop)}
              </span>
              <span className="h-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
                <span
                  className={cn(
                    "block h-full origin-left rounded-full transition-transform duration-(--dur-slow) ease-out",
                    used > BUDGET_WARNING_RATIO ? "bg-danger" : "bg-cilantro",
                  )}
                  style={{ transform: `scaleX(${used})` }}
                />
              </span>
            </span>
          }
        />
      ) : (
        <Stat
          label="Presupuesto semanal"
          value="Sin definir"
          detail={
            <Link
              href="/ajustes"
              className="underline decoration-hairline-strong underline-offset-4 hover:text-ink"
            >
              Defínelo en Ajustes
            </Link>
          }
        />
      )}
    </dl>
  );
}
