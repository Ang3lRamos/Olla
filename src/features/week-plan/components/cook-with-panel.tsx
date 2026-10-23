"use client";

import { Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getIngredient, type IngredientCatalog } from "@/domain/catalog";
import type { Ingredient, PantryItem } from "@/domain/types";
import type { PlannedSlot } from "@/domain/week-plan";
import { ChangePreview } from "@/features/assistant/components/change-preview";
import type { ProposedChange } from "@/features/assistant/sanitize";
import { withChanges } from "@/features/assistant/with-changes";
import { ingredientOptions } from "@/features/catalog/select-options";
import type { RecipeDetail } from "@/features/recipes/types";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { FormMessage } from "@/ui/form-message";
import { Select } from "@/ui/select";
import { matchRecipes, planWithMatches } from "../cook-with";

const PRESELECTED = 8;
const SHOWN = 15;

interface CookWithPanelProps {
  recipes: RecipeDetail[];
  ingredients: Ingredient[];
  catalog: IngredientCatalog;
  pantry: PantryItem[];
  exclude: string[];
  slots: PlannedSlot[];
  recipeName: (recipeId: string | null) => string;
  marketFor: (slots: PlannedSlot[]) => number;
  onApply: (changes: ProposedChange[]) => void;
  /** Le pasa la lista al asistente; null si el plan no lo permite (ni el menú gratis). */
  onAskAssistant: ((ingredientNames: string[]) => void) | null;
}

/** "Armar con lo que tengo": recetas que aprovechan lo que se mercó y llenan la semana. */
export function CookWithPanel(props: CookWithPanelProps) {
  const { catalog, slots } = props;
  const [chosen, setChosen] = useState<string[]>(() => [
    ...new Set(props.pantry.map((item) => item.ingredientId)),
  ]);
  const matches = useMemo(
    () => matchRecipes({ recipes: props.recipes, catalog, chosen: new Set(chosen), exclude: props.exclude }),
    [props.recipes, catalog, chosen, props.exclude],
  );
  const [picked, setPicked] = useState<Set<string> | null>(null);
  // Mientras la persona no toque las casillas, se marcan solas las que más aprovechan.
  const pickedIds = picked ?? new Set(matches.slice(0, PRESELECTED).map((match) => match.recipeId));
  const [preview, setPreview] = useState<{ changes: ProposedChange[]; selected: Set<number> } | null>(null);
  const [notice, setNotice] = useState<string>();
  const names = chosen.map((id) => getIngredient(catalog, id).name);

  const toggleRecipe = (recipeId: string) =>
    setPicked(() => {
      const next = new Set(pickedIds);
      if (next.has(recipeId)) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });

  const fill = () => {
    const changes = planWithMatches(
      matches.filter((match) => pickedIds.has(match.recipeId)),
      slots,
    );
    if (changes.length === 0) {
      setNotice("No quedan casillas vacías donde encajen esas recetas. Elige otras o libera alguna comida.");
      return;
    }
    setNotice(undefined);
    setPreview({ changes, selected: new Set(changes.map((_, index) => index)) });
  };

  if (preview) {
    const chosenChanges = preview.changes.filter((_, index) => preview.selected.has(index));
    return (
      <div className="flex animate-rise flex-col gap-5">
        <p className="text-[15px]">
          Así quedaría la semana con lo que tienes. Las cantidades y el mercado los recalcula Olla.
        </p>
        <ChangePreview
          changes={preview.changes}
          selected={preview.selected}
          onToggle={(index) =>
            setPreview((current) => {
              if (!current) return current;
              const selected = new Set(current.selected);
              if (selected.has(index)) selected.delete(index);
              else selected.add(index);
              return { ...current, selected };
            })
          }
          recipeName={props.recipeName}
          currentRecipeId={() => null}
          marketNowCop={props.marketFor(slots)}
          marketAfterCop={props.marketFor(withChanges(slots, chosenChanges))}
        />
        <div className="sticky -bottom-5 -mx-5 -mb-5 flex flex-wrap gap-2 border-t border-hairline bg-surface px-5 py-3">
          {chosenChanges.length > 0 && (
            <Button onClick={() => props.onApply(chosenChanges)}>
              Aplicar {chosenChanges.length} {chosenChanges.length === 1 ? "cambio" : "cambios"}
            </Button>
          )}
          <Button variant="ghost" onClick={() => setPreview(null)}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          Lo que mercaste o ya tienes. Empezamos con tu despensa; agrega o quita lo que quieras.
        </p>
        <Select
          aria-label="Agregar ingrediente"
          value=""
          options={ingredientOptions(props.ingredients.filter((item) => !chosen.includes(item.id)))}
          onValueChange={(id) => setChosen((current) => [...current, id])}
          placeholder="Agregar: pollo, papa, mazorca…"
          searchable
        />
        {chosen.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Lo que tienes">
            {chosen.map((id, index) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setChosen((current) => current.filter((item) => item !== id))}
                  aria-label={`Quitar ${names[index]}`}
                  className="flex items-center gap-1 rounded-full border border-hairline-strong py-1 pr-2 pl-3 text-sm transition-colors duration-(--dur-fast) ease-out hover:border-muted"
                >
                  {names[index]}
                  <X className="size-3.5 text-muted" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {chosen.length > 0 && matches.length === 0 && (
        <p className="rounded-md bg-sunken px-3 py-2.5 text-sm text-muted">
          Ninguna receta usa eso todavía. Agrega otro ingrediente o crea tu propia receta.
        </p>
      )}
      {matches.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Recetas que lo aprovechan</p>
          <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
            {matches.slice(0, SHOWN).map((match) => (
              <li key={match.recipeId} className="py-2.5">
                <Checkbox
                  checked={pickedIds.has(match.recipeId)}
                  onChange={() => toggleRecipe(match.recipeId)}
                  label={
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">{match.name}</span>
                      <span className="text-xs text-cilantro">Usa {match.uses.join(", ")}</span>
                      {match.missing.length > 0 && (
                        <span className="text-xs text-muted">Te falta {match.missing.join(", ")}</span>
                      )}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      {notice && <FormMessage tone="error">{notice}</FormMessage>}

      <div className="sticky -bottom-5 -mx-5 -mb-5 flex flex-col gap-2 border-t border-hairline bg-surface px-5 py-3">
        <div className="flex flex-wrap gap-2">
          <Button disabled={pickedIds.size === 0} onClick={fill}>
            Llenar las casillas vacías
          </Button>
          {props.onAskAssistant ? (
            <Button
              variant="secondary"
              disabled={chosen.length === 0}
              onClick={() => props.onAskAssistant?.(names)}
            >
              <Sparkles className="size-4" aria-hidden />
              Que el asistente lo arme
            </Button>
          ) : null}
        </div>
        {!props.onAskAssistant && (
          <p className="text-xs text-muted">
            Para que el asistente arme el menú con esto, mira los{" "}
            <Link href="/planes" className="underline decoration-hairline-strong underline-offset-4">
              planes
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
