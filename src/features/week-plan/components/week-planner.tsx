"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { buildCatalog } from "@/domain/catalog";
import type { Ingredient, IngredientPrice, PantryItem } from "@/domain/types";
import { dayIndex, MEAL_LABELS, type IsoDate, type Meal } from "@/domain/week";
import { summarizeWeek, type PlannedSlot } from "@/domain/week-plan";
import type { RecipeDetail, RecipeSummary } from "@/features/recipes/types";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";
import { AssistantPanel } from "@/features/assistant/components/assistant-panel";
import { hasAssistant, type AiQuota } from "@/features/entitlements/quota";
import { buildWeekView, recipeUsage, type NoteView } from "../week-view";
import { NotesPanel } from "./notes-panel";
import { SlotSheetContent } from "./slot-sheet";
import { useWeekPlan } from "./use-week-plan";
import { WeekDaysMobile } from "./week-days-mobile";
import { WeekGrid } from "./week-grid";
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
}

type OpenPanel =
  { kind: "meal"; day: number; meal: Meal } | { kind: "day"; day: number } | { kind: "assistant" } | null;

export function WeekPlanner(props: WeekPlannerProps) {
  const { weekStart, today, weeklyBudgetCop, recipeSummaries, notes } = props;
  const week = useWeekPlan(weekStart, { slots: props.slots, people: props.people });
  const [panel, setPanel] = useState<OpenPanel>(null);

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
  const todayIndex = dayIndex(weekStart, today);

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
        onOpenAssistant={() => setPanel({ kind: "assistant" })}
        assistantLocked={!hasAssistant(props.aiQuota)}
      />

      {week.error && (
        <div
          role="alert"
          className="flex animate-rise items-center justify-between gap-3 rounded-md border border-danger/30 px-3 py-2 text-sm"
        >
          <span>{week.error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            aria-label="Cerrar aviso"
            onClick={week.dismissError}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <WeekSummaryBar weekStart={weekStart} summary={summary} weeklyBudgetCop={weeklyBudgetCop} />

      <WeekGrid
        days={days}
        dayCosts={dayCosts}
        onOpenCell={(day, meal) => setPanel({ kind: "meal", day, meal })}
        onOpenDayNotes={(day) => setPanel({ kind: "day", day })}
      />
      <WeekDaysMobile
        days={days}
        dayCosts={dayCosts}
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
            : openDay
              ? openCell
                ? `${openDay.long} ${openDay.dayOfMonth}`
                : `Notas del ${openDay.long.toLowerCase()}`
              : ""
        }
        description={
          panel?.kind === "assistant"
            ? "Propone recetas; las cantidades y los costos los calcula Olla."
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
            onClear={() => {
              week.clear(openCell.day, openCell.meal);
              setPanel(null);
            }}
          />
        )}
        {panel?.kind === "assistant" && (
          <AssistantPanel
            weekStart={weekStart}
            slots={week.slots}
            notesCount={notes.length}
            recipeName={(recipeId) => (recipeId && recipes.get(recipeId)?.name) || "Receta"}
            marketFor={(slots) =>
              summarizeWeek({ slots, weekPeople: week.people, ...shared }).market.totalCop
            }
            quota={props.aiQuota}
            onApply={(changes) => {
              week.applyChanges(changes);
              setPanel(null);
            }}
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
