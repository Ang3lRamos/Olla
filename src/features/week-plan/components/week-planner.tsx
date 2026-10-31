"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { buildCatalog } from "@/domain/catalog";
import type { Ingredient, IngredientPrice, PantryItem } from "@/domain/types";
import { dayIndex, MEAL_LABELS, type IsoDate, type Meal } from "@/domain/week";
import { dailyNutritionPerPerson } from "@/domain/nutrition";
import type { NutritionGoal } from "@/domain/nutrition-goals";
import { summarizeWeek, toPlannedMeals, type PlannedSlot } from "@/domain/week-plan";
import type { RecipeDetail, RecipeSummary } from "@/features/recipes/types";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";
import { AssistantPanel } from "@/features/assistant/components/assistant-panel";
import type { ProposedChange } from "@/features/assistant/sanitize";
import { withChanges } from "@/features/assistant/with-changes";
import { canUseFreeMenu, hasAssistant, type AiQuota } from "@/features/entitlements/quota";
import { addExtras } from "@/features/shopping/actions";
import { unusedPurchases } from "../cook-with";
import { buildWeekView, recipeUsage, type NoteView } from "../week-view";
import { NotesPanel } from "./notes-panel";
import { SlotSheetContent } from "./slot-sheet";
import { useWeekPlan } from "./use-week-plan";
import { WeekDaysMobile } from "./week-days-mobile";
import { WeekGrid } from "./week-grid";
import { MenuBuilderPanel, type AssistantHandoff } from "./menu-builder-panel";
import { WeekHeader } from "./week-header";
import { WeekSummaryBar } from "./week-summary-bar";

export interface WeekPlannerProps {
  weekStart: IsoDate;
  today: IsoDate;
  people: number;
  slots: PlannedSlot[];
  weeklyBudgetCop: number | null;
  recipes: RecipeDetail[];
  recipeSummaries: RecipeSummary[];
  ingredients: Ingredient[];
  prices: IngredientPrice[];
  pantry: PantryItem[];
  notes: NoteView[];
  aiQuota: AiQuota;
  /** Metas de la persona; vacío si no puso o si su plan no incluye nutrición. */
  goals: NutritionGoal[];
  /** "No incluir" del hogar: no se ofrecen esas recetas al armar con lo que hay. */
  exclude: string[];
}

type OpenPanel =
  | { kind: "meal"; day: number; meal: Meal }
  | { kind: "day"; day: number }
  | ({ kind: "assistant" } & AssistantHandoff)
  | { kind: "menu" }
  | null;

const EXTRAS_ERROR = "El menú quedó guardado, pero no pudimos agregar al mercado lo que ibas a comprar.";

export function WeekPlanner(props: WeekPlannerProps) {
  const { weekStart, today, weeklyBudgetCop, recipeSummaries, notes } = props;
  const week = useWeekPlan(weekStart, { slots: props.slots, people: props.people });
  const [panel, setPanel] = useState<OpenPanel>(null);
  const [extrasError, setExtrasError] = useState<string>();

  const catalog = useMemo(() => buildCatalog(props.ingredients), [props.ingredients]);
  const prices = useMemo(
    () => new Map(props.prices.map((price) => [price.ingredientId, price])),
    [props.prices],
  );
  const recipes = useMemo(() => new Map(props.recipes.map((recipe) => [recipe.id, recipe])), [props.recipes]);

  const shared = { recipes, pantry: props.pantry, catalog, prices };
  const days = buildWeekView({ weekStart, today, people: week.people, slots: week.slots, notes, ...shared });
  const summary = summarizeWeek({ slots: week.slots, weekPeople: week.people, ...shared });
  const dayCosts = summary.days.map((day) => day.totalCop);
  // Nutrición por persona y día: es de los planes pagos.
  const dayNutrition =
    props.aiQuota.plan === "free"
      ? null
      : {
          days: dailyNutritionPerPerson(toPlannedMeals(week.slots, recipes, week.people), catalog),
          goals: props.goals,
        };
  const todayIndex = dayIndex(weekStart, today);
  const error = week.error ?? extrasError;
  const recipeName = (recipeId: string | null) => (recipeId && recipes.get(recipeId)?.name) || "Receta";
  const marketFor = (slots: PlannedSlot[]) =>
    summarizeWeek({ slots, weekPeople: week.people, ...shared }).market.totalCop;

  const apply = (changes: ProposedChange[], extras: Ingredient[]) => {
    week.applyChanges(changes);
    setPanel(null);
    if (extras.length === 0) return;
    addExtras({ weekStart, items: extras.map(({ name, category }) => ({ name, category })) })
      .then((result) => setExtrasError(result.ok ? undefined : EXTRAS_ERROR))
      .catch(() => setExtrasError(EXTRAS_ERROR));
  };
  const leftoverOf = (buy: Ingredient[], changes: ProposedChange[]) => {
    const unused = unusedPurchases(
      buy.map((ingredient) => ingredient.id),
      withChanges(week.slots, changes),
      recipes,
    );
    return buy.filter((ingredient) => unused.includes(ingredient.id));
  };

  const openDay = panel && "day" in panel ? days[panel.day] : undefined;
  const openCell =
    panel?.kind === "meal" ? openDay?.cells.find((cell) => cell.meal === panel.meal) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <WeekHeader
        weekStart={weekStart}
        isCurrentWeek={todayIndex !== null}
        people={week.people}
        onPeopleChange={week.setPeople}
        onOpenMenuBuilder={() => setPanel({ kind: "menu" })}
      />

      {error && (
        <div
          role="alert"
          className="flex animate-rise items-center justify-between gap-3 rounded-md border border-danger/30 px-3 py-2 text-sm"
        >
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            aria-label="Cerrar aviso"
            onClick={() => {
              week.dismissError();
              setExtrasError(undefined);
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <WeekSummaryBar weekStart={weekStart} summary={summary} weeklyBudgetCop={weeklyBudgetCop} />

      <WeekGrid
        days={days}
        dayCosts={dayCosts}
        dayNutrition={dayNutrition}
        onOpenCell={(day, meal) => setPanel({ kind: "meal", day, meal })}
        onOpenDayNotes={(day) => setPanel({ kind: "day", day })}
      />
      <WeekDaysMobile
        days={days}
        dayCosts={dayCosts}
        dayNutrition={dayNutrition}
        initialDay={todayIndex ?? 0}
        onOpenCell={(day, meal) => setPanel({ kind: "meal", day, meal })}
        onOpenDayNotes={(day) => setPanel({ kind: "day", day })}
      />

      <Sheet
        open={panel !== null}
        onClose={() => setPanel(null)}
        title={
          panel?.kind === "assistant"
            ? "Asistente"
            : panel?.kind === "menu"
              ? "Armar el menú"
              : openDay
                ? openCell
                  ? `${openDay.long} ${openDay.dayOfMonth}`
                  : `Notas del ${openDay.long.toLowerCase()}`
                : ""
        }
        description={
          panel?.kind === "assistant"
            ? "Propone recetas; las cantidades y los costos los calcula Olla."
            : panel?.kind === "menu"
              ? "Con lo que tienes, con el asistente o mezclando los dos."
              : openCell
                ? MEAL_LABELS[openCell.meal]
                : openDay
                  ? `${openDay.dayOfMonth} · todo el día`
                  : undefined
        }
      >
        {openCell && (
          <SlotSheetContent
            key={`${openCell.day}-${openCell.meal}`}
            cell={openCell}
            weekPeople={week.people}
            recipes={recipeSummaries}
            usage={recipeUsage(week.slots)}
            onAssign={(recipeId, peopleOverride) =>
              week.assign({ day: openCell.day, meal: openCell.meal, recipeId, peopleOverride })
            }
            onCookedChange={(cooked) => week.setCooked(openCell.day, openCell.meal, cooked)}
            onClear={() => {
              week.clear(openCell.day, openCell.meal);
              setPanel(null);
            }}
          />
        )}
        {/* Sigue montado mientras el asistente responde: al volver, la lista sigue ahí. */}
        {(panel?.kind === "menu" || panel?.kind === "assistant") && (
          <div hidden={panel.kind === "assistant"}>
            <MenuBuilderPanel
              recipes={props.recipes}
              ingredients={props.ingredients}
              prices={prices}
              pantry={props.pantry}
              exclude={props.exclude}
              slots={week.slots}
              weekPeople={week.people}
              assistantLocked={!hasAssistant(props.aiQuota) && !canUseFreeMenu(props.aiQuota)}
              nutritionLocked={props.aiQuota.plan === "free"}
              recipeName={recipeName}
              marketFor={marketFor}
              onApply={apply}
              onAskAssistant={(handoff) => setPanel({ kind: "assistant", ...handoff })}
            />
          </div>
        )}
        {panel?.kind === "assistant" && (
          <AssistantPanel
            key={`${panel.focus.join("|")}-${panel.style}`}
            focus={panel.focus}
            style={panel.style}
            autoPropose={panel.propose}
            weekStart={weekStart}
            slots={week.slots}
            notesCount={notes.length}
            recipeName={recipeName}
            marketFor={marketFor}
            quota={props.aiQuota}
            onBack={() => setPanel({ kind: "menu" })}
            leftoverFor={(changes) => leftoverOf(panel.buy, changes).map((ingredient) => ingredient.name)}
            onApply={(changes, addLeftover) =>
              apply(changes, addLeftover ? leftoverOf(panel.buy, changes) : [])
            }
          />
        )}
        {panel?.kind === "day" && openDay && (
          <NotesPanel
            key={openDay.date}
            date={openDay.date}
            meal={null}
            notes={openDay.dayNotes}
            placeholder="Ej.: llega la abuela, hay que cocinar para 6…"
          />
        )}
      </Sheet>
    </div>
  );
}
