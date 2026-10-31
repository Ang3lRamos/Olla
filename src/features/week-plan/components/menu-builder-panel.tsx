"use client";

import { useMemo, useState } from "react";
import { getIngredient } from "@/domain/catalog";
import type { PriceList } from "@/domain/costs";
import { styleScore, type MenuStyle } from "@/domain/menu-styles";
import type { Ingredient, PantryItem } from "@/domain/types";
import type { PlannedSlot } from "@/domain/week-plan";
import type { ProposedChange } from "@/features/assistant/sanitize";
import { withChanges } from "@/features/assistant/with-changes";
import type { RecipeDetail } from "@/features/recipes/types";
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
import { MenuStylePicker } from "./menu-style-picker";
import { StockPreview } from "./stock-preview";
import { StockRecipes } from "./stock-recipes";
import { useMenuList } from "./use-menu-list";

const PRESELECTED = 8;

/** Lo que el asistente recibe: lo que hay que priorizar, lo que se piensa mercar y el estilo. */
export interface AssistantHandoff {
  focus: string[];
  buy: Ingredient[];
  style: MenuStyle | null;
}

interface MenuBuilderPanelProps {
  recipes: RecipeDetail[];
  ingredients: Ingredient[];
  prices: PriceList;
  pantry: PantryItem[];
  exclude: string[];
  slots: PlannedSlot[];
  weekPeople: number;
  assistantLocked: boolean;
  nutritionLocked: boolean;
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
  const list = useMenuList(props.ingredients, props.pantry);
  const { catalog, chosen, buy } = list;
  const [mode, setMode] = useState<MenuMode>("mine");
  const [style, setStyle] = useState<MenuStyle | null>(null);
  const [step, setStep] = useState<Step>({ kind: "list" });
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [notice, setNotice] = useState<string>();

  const recipes = useMemo(() => new Map(props.recipes.map((recipe) => [recipe.id, recipe])), [props.recipes]);
  const matches = matchRecipes({
    recipes: props.recipes,
    catalog,
    chosen: new Set(chosen),
    exclude: props.exclude,
    score: style ? (recipe) => styleScore(style, recipe, catalog, props.prices) : undefined,
  });
  const pickedIds = picked ?? new Set(preselectMatches(matches, PRESELECTED).map((match) => match.recipeId));
  const buyIngredients = buy.map((id) => getIngredient(catalog, id));
  const leftoverOf = (changes: ProposedChange[]) => {
    const unused = unusedPurchases(buy, withChanges(slots, changes), recipes);
    return buyIngredients.filter((ingredient) => unused.includes(ingredient.id));
  };

  const next = () => {
    if (mode !== "mine") {
      return props.onAskAssistant({
        focus: mode === "mixed" ? chosen.map((id) => getIngredient(catalog, id).name) : [],
        buy: mode === "mixed" ? buyIngredients : [],
        style,
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
      pantry: list.home,
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
          <MenuStylePicker value={style} onChange={setStyle} nutritionLocked={props.nutritionLocked} />
          {mode !== "suggest" && (
            <MenuIngredients
              ingredients={list.ingredients}
              catalog={catalog}
              pantry={list.pantry}
              skipped={list.skipped}
              onToggleHome={list.toggleHome}
              buy={buy}
              onAddBuy={list.addBuy}
              onRemoveBuy={list.removeBuy}
              onSaveHome={list.saveHome}
              saving={list.saving}
              saveError={list.saveError}
              onIngredientCreated={list.addCreated}
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
