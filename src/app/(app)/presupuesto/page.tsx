import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { formatCop } from "@/domain/money";
import { dayIndex, weekDates, weekdayLabels } from "@/domain/week";
import { summarizeWeek } from "@/domain/week-plan";
import { DailyCostChart } from "@/features/budget/components/daily-cost-chart";
import { PriceTable, type PriceTableRow } from "@/features/budget/components/price-table";
import { WeekNav } from "@/features/week-plan/components/week-nav";
import { loadWeek } from "@/features/week-plan/load-week";
import { Skeleton } from "@/ui/skeleton";

export const metadata: Metadata = { title: "Presupuesto" };

const DAYS_IN_WEEK = 7;

function Stat({ label, value, detail }: { label: string; value: string; detail?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 pr-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display text-xl font-semibold tabular-nums">{value}</dd>
      {detail && <dd className="text-xs text-muted">{detail}</dd>}
    </div>
  );
}

async function Budget({ searchParams }: Pick<PageProps<"/presupuesto">, "searchParams">) {
  const week = await loadWeek((await searchParams).semana);
  const recipes = new Map(week.recipes.map((recipe) => [recipe.id, recipe]));
  const summary = summarizeWeek({
    slots: week.plan.slots,
    recipes,
    weekPeople: week.plan.people,
    pantry: week.pantry,
    catalog: week.catalog,
    prices: week.prices,
  });
  const budget = week.household.weeklyBudgetCop;
  const market = summary.market.totalCop;

  const usedIds = new Set(
    week.plan.slots.flatMap(
      (slot) => recipes.get(slot.recipeId)?.ingredients.map((line) => line.ingredientId) ?? [],
    ),
  );
  const ownIds = new Set(
    week.priceEntries.filter((entry) => entry.householdId !== null).map((entry) => entry.ingredientId),
  );
  const rows: PriceTableRow[] = week.ingredients.map((ingredient) => {
    const price = week.prices.get(ingredient.id);
    return {
      ingredient,
      price: price ? { priceCop: price.priceCop, per: price.per } : null,
      isOwn: ownIds.has(ingredient.id),
      usedThisWeek: usedIds.has(ingredient.id),
    };
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <WeekNav
          basePath="/presupuesto"
          weekStart={week.weekStart}
          isCurrentWeek={dayIndex(week.weekStart, week.today) !== null}
        />
        <h1 className="font-display text-title font-semibold md:text-display">Presupuesto</h1>
      </div>

      <dl className="grid grid-cols-2 gap-y-4 border-y border-hairline py-4 md:grid-cols-4">
        <Stat label="Mercado de la semana" value={formatCop(market)} detail="Ya descuenta la despensa" />
        <Stat
          label="Presupuesto semanal"
          value={budget ? formatCop(budget) : "Sin definir"}
          detail={
            <Link
              href="/ajustes"
              className="underline decoration-hairline-strong underline-offset-4 hover:text-ink"
            >
              {budget ? "Cambiar" : "Defínelo en Ajustes"}
            </Link>
          }
        />
        <Stat
          label={budget && market > budget ? "Por encima" : "Disponible"}
          value={budget ? formatCop(Math.abs(budget - market)) : "—"}
        />
        <Stat
          label="Promedio por día"
          value={formatCop(summary.averagePerPlannedDayCop)}
          detail="Días con comidas"
        />
      </dl>

      <DailyCostChart
        days={weekDates(week.weekStart).map((date, day) => ({
          ...weekdayLabels(date),
          costCop: summary.days[day]?.totalCop ?? 0,
        }))}
        dailyCapCop={budget ? Math.round(budget / DAYS_IN_WEEK) : null}
      />

      <PriceTable rows={rows} />
    </div>
  );
}

export default function BudgetPage({ searchParams }: PageProps<"/presupuesto">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-8" role="status" aria-label="Cargando presupuesto">
          <Skeleton className="h-11 w-60" />
          <Skeleton className="h-20" />
          <Skeleton className="h-52" />
        </div>
      }
    >
      <Budget searchParams={searchParams} />
    </Suspense>
  );
}
