import type { Metadata } from "next";
import { Suspense } from "react";
import { dayIndex } from "@/domain/week";
import { ShoppingList } from "@/features/shopping/components/shopping-list";
import { ShoppingListSkeleton } from "@/features/shopping/components/shopping-list-skeleton";
import { getShoppingState } from "@/features/shopping/data";
import { WeekNav } from "@/features/week-plan/components/week-nav";
import { loadWeek } from "@/features/week-plan/load-week";

export const metadata: Metadata = { title: "Mercado" };

async function Market({ searchParams }: Pick<PageProps<"/mercado">, "searchParams">) {
  const week = await loadWeek((await searchParams).semana);
  const { purchases, extras } = await getShoppingState(week.plan.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <WeekNav
          basePath="/mercado"
          weekStart={week.weekStart}
          isCurrentWeek={dayIndex(week.weekStart, week.today) !== null}
        />
        <h1 className="font-display text-title font-semibold md:text-display">Mercado</h1>
        <p className="max-w-2xl text-muted">
          Sale del menú de la semana, suma lo repetido y resta lo que ya tienes en la despensa.
        </p>
      </div>
      <ShoppingList
        key={week.weekStart}
        weekStart={week.weekStart}
        people={week.plan.people}
        slots={week.plan.slots}
        recipes={week.recipes}
        ingredients={week.ingredients}
        prices={[...week.prices.values()]}
        pantry={week.pantry}
        purchases={purchases}
        extras={extras}
      />
    </div>
  );
}

export default function MarketPage({ searchParams }: PageProps<"/mercado">) {
  return (
    <Suspense fallback={<ShoppingListSkeleton />}>
      <Market searchParams={searchParams} />
    </Suspense>
  );
}
