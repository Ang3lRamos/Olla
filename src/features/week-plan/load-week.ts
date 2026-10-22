import "server-only";
import { addDays, localDate, resolveWeekStart } from "@/domain/week";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { listPantry } from "@/features/pantry/data";
import { listRecipes } from "@/features/recipes/data";
import { getWeekPlan } from "./data";

/** Lo que necesitan la semana y el mercado: el plan, el catálogo con precios y la despensa. */
export async function loadWeek(weekParam: string | string[] | undefined) {
  const household = await requireHousehold();
  const today = localDate(new Date());
  const weekStart = resolveWeekStart(typeof weekParam === "string" ? weekParam : undefined, today);

  const [plan, recipes, catalogData, pantry] = await Promise.all([
    getWeekPlan(weekStart, household.defaultPeople),
    listRecipes(),
    getCatalog(),
    listPantry(),
  ]);
  return {
    household,
    today,
    weekStart,
    weekEnd: addDays(weekStart, 6),
    plan,
    recipes,
    pantry,
    ...catalogData,
  };
}
