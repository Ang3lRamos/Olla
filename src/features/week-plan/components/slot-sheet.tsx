"use client";

import { ArrowLeft, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatCop } from "@/domain/money";
import { RECIPE_CATEGORY_LABELS } from "@/domain/recipe-categories";
import { MEAL_LABELS } from "@/domain/week";
import { MAX_PEOPLE } from "@/features/household/schemas";
import type { RecipeSummary } from "@/features/recipes/types";
import { Button, buttonClasses } from "@/ui/button";
import { NumberStepper } from "@/ui/number-stepper";
import type { CellView } from "../week-view";
import { NotesPanel } from "./notes-panel";
import { RecipePicker } from "./recipe-picker";

interface SlotSheetContentProps {
  cell: CellView;
  weekPeople: number;
  recipes: RecipeSummary[];
  usage: ReadonlyMap<string, number>;
  onAssign: (recipeId: string, peopleOverride: number | null) => void;
  onClear: () => void;
}

/** Contenido del panel de una comida: elegir receta, ajustar personas y anotar. */
export function SlotSheetContent({
  cell,
  weekPeople,
  recipes,
  usage,
  onAssign,
  onClear,
}: SlotSheetContentProps) {
  const [picking, setPicking] = useState(cell.recipe === null);
  const keepOverride = cell.isOverride ? cell.servings : null;

  if (picking || !cell.recipe) {
    return (
      <div className="flex flex-col gap-4">
        {cell.recipe && (
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={() => setPicking(false)}>
            <ArrowLeft className="size-4" aria-hidden />
            Volver
          </Button>
        )}
        <RecipePicker
          meal={cell.meal}
          recipes={recipes}
          usage={usage}
          selectedId={cell.recipe?.id ?? null}
          onPick={(recipeId) => {
            onAssign(recipeId, keepOverride);
            setPicking(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-md border border-hairline p-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted">{RECIPE_CATEGORY_LABELS[cell.recipe.category]}</p>
          <p className="text-lg leading-snug font-medium">{cell.recipe.name}</p>
          <p className="text-sm text-muted">
            Costo estimado{" "}
            <span className="font-medium text-ink tabular-nums">{formatCop(cell.recipe.costCop)}</span> para{" "}
            {cell.servings}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPicking(true)}>
            <RefreshCw className="size-4" aria-hidden />
            Cambiar receta
          </Button>
          <Link
            href={`/recetas/${cell.recipe.id}`}
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            <ExternalLink className="size-4" aria-hidden />
            Ver receta
          </Link>
          <Button variant="ghost" size="sm" className="text-muted hover:text-danger" onClick={onClear}>
            <Trash2 className="size-4" aria-hidden />
            Quitar
          </Button>
        </div>
      </section>

      <NumberStepper
        name="mealPeople"
        label={`Personas en este ${MEAL_LABELS[cell.meal].toLowerCase()}`}
        defaultValue={cell.servings}
        min={1}
        max={MAX_PEOPLE}
        unit={["persona", "personas"]}
        onValueChange={(people) => onAssign(cell.recipe!.id, people === weekPeople ? null : people)}
      />

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Notas de esta comida</h3>
        <NotesPanel
          date={cell.date}
          meal={cell.meal}
          notes={cell.notes}
          placeholder="Ej.: sobró arroz, a los niños no les gustó…"
        />
      </section>
    </div>
  );
}
