import type { ReactNode } from "react";
import { formatCop } from "@/domain/money";
import { cn } from "@/ui/cn";
import { MEALS, SAMPLE_WEEK, WEEKLY_BUDGET_COP, dayCost } from "./sample-week";

const plannedMeals = SAMPLE_WEEK.flatMap((day) => day.slots).filter(Boolean).length;
const totalMeals = SAMPLE_WEEK.length * MEALS.length;
const weekCost = SAMPLE_WEEK.reduce((sum, day) => sum + dayCost(day), 0);
const pantryMeals = SAMPLE_WEEK.flatMap((day) => day.slots).filter((slot) => slot?.usesPantry).length;
const budgetUsed = Math.min(weekCost / WEEKLY_BUDGET_COP, 1);
const BUDGET_WARNING_RATIO = 0.9;

function Stat({ label, value, detail }: { label: string; value: string; detail?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 first:pl-0 max-md:odd:pl-0 md:border-l md:border-hairline md:first:border-l-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display text-xl font-semibold tabular-nums">{value}</dd>
      {detail && <dd className="text-xs text-muted">{detail}</dd>}
    </div>
  );
}

export function WeekSummary() {
  return (
    <dl className="grid grid-cols-2 border-y border-hairline md:grid-cols-4">
      <Stat
        label="Comidas planeadas"
        value={`${plannedMeals} de ${totalMeals}`}
        detail="Falta la comida del domingo"
      />
      <Stat label="Mercado estimado" value={formatCop(weekCost)} detail="Ya descuenta la despensa" />
      <Stat label="Promedio por día" value={formatCop(weekCost / SAMPLE_WEEK.length)} />
      <Stat
        label="Presupuesto semanal"
        value={formatCop(WEEKLY_BUDGET_COP - weekCost)}
        detail={
          <span className="flex flex-col gap-1.5">
            <span>
              disponibles de {formatCop(WEEKLY_BUDGET_COP)} · {pantryMeals} comidas usan despensa
            </span>
            <span className="h-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
              <span
                className={cn(
                  "block h-full origin-left rounded-full transition-transform duration-(--dur-slow) ease-out",
                  budgetUsed > BUDGET_WARNING_RATIO ? "bg-achiote" : "bg-cilantro",
                )}
                style={{ transform: `scaleX(${budgetUsed})` }}
              />
            </span>
          </span>
        }
      />
    </dl>
  );
}
