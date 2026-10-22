import type { Metadata } from "next";
import { Suspense } from "react";
import { addDays, localDate, resolveWeekStart } from "@/domain/week";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { listNotesBetween } from "@/features/notes/data";
import { listPantry } from "@/features/pantry/data";
import { listRecipes, summarizeRecipe } from "@/features/recipes/data";
import { WeekPlanner } from "@/features/week-plan/components/week-planner";
import { WeekPlannerSkeleton } from "@/features/week-plan/components/week-planner-skeleton";
import { getWeekPlan } from "@/features/week-plan/data";

export const metadata: Metadata = { title: "Semana" };

async function Week({ searchParams }: Pick<PageProps<"/semana">, "searchParams">) {
  const [{ semana }, household] = await Promise.all([searchParams, requireHousehold()]);
  const today = localDate(new Date());
  const weekStart = resolveWeekStart(typeof semana === "string" ? semana : undefined, today);

  const [plan, recipes, { ingredients, catalog, prices }, pantry, notes] = await Promise.all([
    getWeekPlan(weekStart, household.defaultPeople),
    listRecipes(),
    getCatalog(),
    listPantry(),
    listNotesBetween(weekStart, addDays(weekStart, 6)),
  ]);

  return (
    <WeekPlanner
      // Al cambiar de semana se reinicia el estado local (personas, día elegido en celular).
      key={weekStart}
      weekStart={weekStart}
      today={today}
      people={plan.people}
      slots={plan.slots}
      weeklyBudgetCop={household.weeklyBudgetCop}
      recipes={recipes}
      recipeSummaries={recipes.map((recipe) => summarizeRecipe(recipe, catalog, prices))}
      ingredients={ingredients}
      prices={[...prices.values()]}
      pantry={pantry}
      notes={notes}
    />
  );
}

export default function WeekPage({ searchParams }: PageProps<"/semana">) {
  return (
    <Suspense fallback={<WeekPlannerSkeleton />}>
      <Week searchParams={searchParams} />
    </Suspense>
  );
}
