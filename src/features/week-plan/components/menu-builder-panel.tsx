"use client";

import { useMemo, useState, useTransition } from "react";
import { buildCatalog, getIngredient } from "@/domain/catalog";
import type { Ingredient, PantryItem } from "@/domain/types";
import type { PlannedSlot } from "@/domain/week-plan";
import type { ProposedChange } from "@/features/assistant/sanitize";
import { withChanges } from "@/features/assistant/with-changes";
import { savePantryItem } from "@/features/pantry/actions";
import type { PantryItemInput } from "@/features/pantry/schemas";
import type { RecipeDetail } from "@/features/recipes/types";
import { parseDecimal } from "@/lib/decimal-input";
import { Button } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import {
  matchRecipes,
  planWithMatches,
  preselectMatches,
  unusedPurchases,
  type StockPlan,
} from "../cook-with";
import { MenuIngredients } from "./menu-ingredients";
import { MenuModePicker, type MenuMode } from "./menu-mode-picker";
import { StockPreview } from "./stock-preview";
import { StockRecipes } from "./stock-recipes";

const PRESELECTED = 8;

/** Lo que el asistente recibe: lo que hay que priorizar y lo que se piensa mercar. */
export interface AssistantHandoff {
  focus: string[];
  buy: Ingredient[];
}

interface MenuBuilderPanelProps {
  recipes: RecipeDetail[];
  ingredients: Ingredient[];
  pantry: PantryItem[];
  exclude: string[];
  slots: PlannedSlot[];
  weekPeople: number;
  assistantLocked: boolean;
  recipeName: (recipeId: string | null) => string;
  marketFor: (slots: PlannedSlot[]) => number;
  /** `extras`: lo que se iba a mercar sin receta que lo use y la persona quiere en el mercado. */
  onApply: (changes: ProposedChange[], extras: Ingredient[]) => void;
  onAskAssistant: (handoff: AssistantHandoff) => void;
}

type Step = { kind: "list" } | { kind: "recipes" } | { kind: "preview"; plan: StockPlan };

/** Armar el menú: solo con lo que hay, mezclando con el asistente o que el asistente proponga. */
export function MenuBuilderPanel(props: MenuBuilderPanelProps) {
  const { slots, weekPeople } = props;
  const [mode, setMode] = useState<MenuMode>("mine");
  const [step, setStep] = useState<Step>({ kind: "list" });
  const [created, setCreated] = useState<Ingredient[]>([]);
  const [saved, setSaved] = useState<PantryItem[]>([]);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [buy, setBuy] = useState<string[]>([]);
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [notice, setNotice] = useState<string>();
  const [saveError, setSaveError] = useState<string>();
  const [saving, startSaving] = useTransition();

  const ingredients = useMemo(
    () => [
      ...props.ingredients,
      ...created.filter((item) => !props.ingredients.some((other) => other.id === item.id)),
    ],
    [props.ingredients, created],
  );
  const catalog = useMemo(() => buildCatalog(ingredients), [ingredients]);
  const recipes = useMemo(() => new Map(props.recipes.map((recipe) => [recipe.id, recipe])), [props.recipes]);
  const pantry = [
    ...saved.filter((item) => !props.pantry.some((other) => other.ingredientId === item.ingredientId)),
    ...props.pantry,
  ];
  const home = pantry.filter((item) => !skipped.has(item.ingredientId));
  const chosen = [...home.map((item) => item.ingredientId), ...buy];
  const matches = matchRecipes({
    recipes: props.recipes,
    catalog,
    chosen: new Set(chosen),
    exclude: props.exclude,
  });
  const pickedIds = picked ?? new Set(preselectMatches(matches, PRESELECTED).map((match) => match.recipeId));
  const buyIngredients = buy.map((id) => getIngredient(catalog, id));
  const leftoverOf = (changes: ProposedChange[]) => {
    const unused = unusedPurchases(buy, withChanges(slots, changes), recipes);
    return buyIngredients.filter((ingredient) => unused.includes(ingredient.id));
  };

  const saveHome = (input: PantryItemInput) =>
    new Promise<boolean>((resolve) =>
      startSaving(async () => {
        const result = await savePantryItem(input);
        setSaveError(result.ok ? undefined : result.error);
        if (result.ok) {
          const item = {
            ingredientId: input.ingredientId,
            quantity: { amount: parseDecimal(input.quantity), unit: input.unit },
          };
          setSaved((current) => [
            ...current.filter((other) => other.ingredientId !== item.ingredientId),
            item,
          ]);
        }
        resolve(result.ok);
      }),
    );

  const next = () => {
    if (mode === "suggest") return props.onAskAssistant({ focus: [], buy: [] });
    if (mode === "mixed") {
      return props.onAskAssistant({
        focus: chosen.map((id) => getIngredient(catalog, id).name),
        buy: buyIngredients,
      });
    }
    setNotice(undefined);
    setPicked(null);
    setStep({ kind: "recipes" });
  };

  const fill = () => {
    const plan = planWithMatches({
      picked: matches.filter((match) => pickedIds.has(match.recipeId)),
      slots,
      recipes,
      catalog,
      weekPeople,
      pantry: home,
    });
    if (plan.changes.length > 0) {
      setNotice(undefined);
      return setStep({ kind: "preview", plan });
    }
    setNotice(
      plan.ranOut.length > 0
        ? `Lo que hay en casa de ${plan.ranOut.join(", ")} no alcanza para esas recetas. Agrégalo a «Lo voy a mercar» o elige otras.`
        : "No quedan casillas vacías donde encajen esas recetas. Elige otras o libera alguna comida.",
    );
  };

  if (step.kind === "preview") {
    return (
      <StockPreview
        plan={step.plan}
        slots={slots}
        recipeName={props.recipeName}
        marketFor={props.marketFor}
        leftoverFor={(changes) => leftoverOf(changes).map((ingredient) => ingredient.name)}
        onApply={(changes, addLeftover) => props.onApply(changes, addLeftover ? leftoverOf(changes) : [])}
        onBack={() => setStep({ kind: "recipes" })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {step.kind === "list" ? (
        <>
          <MenuModePicker value={mode} onChange={setMode} assistantLocked={props.assistantLocked} />
          {mode !== "suggest" && (
            <MenuIngredients
              ingredients={ingredients}
              catalog={catalog}
              pantry={pantry}
              skipped={skipped}
              onToggleHome={(id) =>
                setSkipped((current) => {
                  const nextSkipped = new Set(current);
                  if (nextSkipped.has(id)) nextSkipped.delete(id);
                  else nextSkipped.add(id);
                  return nextSkipped;
                })
              }
              buy={buy}
              onAddBuy={(id) => setBuy((current) => [...current, id])}
              onRemoveBuy={(id) => setBuy((current) => current.filter((other) => other !== id))}
              onSaveHome={saveHome}
              saving={saving}
              saveError={saveError}
              onIngredientCreated={(ingredient) => setCreated((current) => [...current, ingredient])}
            />
          )}
        </>
      ) : (
        <StockRecipes
          matches={matches}
          picked={pickedIds}
          onToggle={(id) =>
            setPicked(() => {
              const nextPicked = new Set(pickedIds);
              if (nextPicked.has(id)) nextPicked.delete(id);
              else nextPicked.add(id);
              return nextPicked;
            })
          }
        />
      )}
      {notice && <FormMessage tone="error">{notice}</FormMessage>}

      <div className="sticky -bottom-5 -mx-5 -mb-5 flex flex-wrap gap-2 border-t border-hairline bg-surface px-5 py-3">
        {step.kind === "list" ? (
          <Button disabled={mode !== "suggest" && chosen.length === 0} onClick={next}>
            {mode === "mine" ? "Ver recetas" : "Pedir al asistente"}
          </Button>
        ) : (
          <>
            <Button disabled={pickedIds.size === 0} onClick={fill}>
              Llenar las casillas vacías
            </Button>
            <Button variant="ghost" onClick={() => setStep({ kind: "list" })}>
              Volver
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
