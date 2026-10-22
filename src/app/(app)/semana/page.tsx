import type { Metadata } from "next";
import { Suspense } from "react";
import { RenewalNotice } from "@/features/billing/components/renewal-notice";
import { getEntitlement } from "@/features/billing/data";
import { planNotice } from "@/features/billing/plan-notice";
import { getAiQuota } from "@/features/entitlements/data";
import { GuidedTour } from "@/features/help/components/guided-tour";
import { listNotesBetween } from "@/features/notes/data";
import { summarizeRecipe } from "@/features/recipes/data";
import { WeekPlanner } from "@/features/week-plan/components/week-planner";
import { WeekPlannerSkeleton } from "@/features/week-plan/components/week-planner-skeleton";
import { loadWeek } from "@/features/week-plan/load-week";

export const metadata: Metadata = { title: "Semana" };

async function Week({ searchParams }: Pick<PageProps<"/semana">, "searchParams">) {
  const week = await loadWeek((await searchParams).semana);
  const [notes, aiQuota, entitlement] = await Promise.all([
    listNotesBetween(week.weekStart, week.weekEnd),
    getAiQuota(week.household.id),
    getEntitlement(week.household.id),
  ]);
  const notice = planNotice(entitlement, new Date());

  return (
    <div className="flex flex-col gap-6">
      {notice && <RenewalNotice notice={notice} />}
      <WeekPlanner
        // Al cambiar de semana se reinicia el estado local (personas, día elegido en celular).
        key={week.weekStart}
        weekStart={week.weekStart}
        today={week.today}
        people={week.plan.people}
        slots={week.plan.slots}
        weeklyBudgetCop={week.household.weeklyBudgetCop}
        recipes={week.recipes}
        recipeSummaries={week.recipes.map((recipe) => summarizeRecipe(recipe, week.catalog, week.prices))}
        ingredients={week.ingredients}
        prices={[...week.prices.values()]}
        pantry={week.pantry}
        notes={notes}
        aiQuota={aiQuota}
      />
    </div>
  );
}

export default function WeekPage({ searchParams }: PageProps<"/semana">) {
  return (
    <>
      <Suspense fallback={<WeekPlannerSkeleton />}>
        <Week searchParams={searchParams} />
      </Suspense>
      <GuidedTour />
    </>
  );
}
