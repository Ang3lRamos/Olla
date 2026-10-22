"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import type { RecipeCategory } from "@/domain/recipe-categories";
import type { Ingredient } from "@/domain/types";
import { Button, buttonClasses } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import { NumberStepper } from "@/ui/number-stepper";
import { TextField } from "@/ui/text-field";
import { formatDecimalInput } from "@/lib/decimal-input";
import { saveRecipe, type RecipeFormState } from "../actions";
import {
  MAX_RECIPE_INGREDIENTS,
  MAX_RECIPE_SERVINGS,
  type RecipeFieldErrors,
  type RecipeFormInput,
} from "../schemas";
import type { RecipeDetail } from "../types";
import { IngredientLineFields, type IngredientLineDraft } from "./ingredient-line-fields";
import { CategoryPicker, StepsField } from "./recipe-form-fields";

interface RecipeFormProps {
  ingredients: Ingredient[];
  recipe?: RecipeDetail;
  cancelHref: string;
}

const emptyLine = (): IngredientLineDraft => ({
  key: crypto.randomUUID(),
  ingredientId: "",
  quantity: "",
  unit: "g",
  note: "",
});

const toDraftLines = (recipe?: RecipeDetail): IngredientLineDraft[] =>
  recipe
    ? recipe.ingredients.map((line) => ({
        key: crypto.randomUUID(),
        ingredientId: line.ingredientId,
        quantity: formatDecimalInput(line.quantity.amount),
        unit: line.quantity.unit,
        note: line.note ?? "",
      }))
    : [emptyLine()];

export function RecipeForm({ ingredients, recipe, cancelHref }: RecipeFormProps) {
  const [state, formAction, pending] = useActionState<RecipeFormState, FormData>(saveRecipe, {});
  const [name, setName] = useState(recipe?.name ?? "");
  const [category, setCategory] = useState<RecipeCategory>(recipe?.category ?? "main");
  const [baseServings, setBaseServings] = useState(recipe?.baseServings ?? 4);
  const [prepMinutes, setPrepMinutes] = useState(recipe?.prepMinutes ? String(recipe.prepMinutes) : "");
  const [steps, setSteps] = useState(recipe?.steps.join("\n") ?? "");
  const [lines, setLines] = useState(() => toDraftLines(recipe));
  // Los errores del último envío se borran campo por campo a medida que se corrigen.
  const [errors, setErrors] = useState<RecipeFieldErrors>({});
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    setErrors(state.fieldErrors ?? {});
  }
  const clearErrors = (shouldClear: (path: string) => boolean) =>
    setErrors((current) =>
      Object.fromEntries(Object.entries(current).filter(([path]) => !shouldClear(path))),
    );
  const clearField = (field: string) => clearErrors((path) => path === field);

  const payload: RecipeFormInput = {
    id: recipe?.id ?? null,
    name,
    category,
    baseServings,
    prepMinutes,
    steps,
    ingredients: lines.map(({ ingredientId, quantity, unit, note }) => ({
      ingredientId,
      quantity,
      unit,
      note,
    })),
  };
  const lineErrors = (index: number) => ({
    ingredientId: errors[`ingredients.${index}.ingredientId`],
    quantity: errors[`ingredients.${index}.quantity`],
    unit: errors[`ingredients.${index}.unit`],
    note: errors[`ingredients.${index}.note`],
  });
  const updateLine = (index: number, next: IngredientLineDraft) => {
    setLines((current) => current.map((line) => (line.key === next.key ? next : line)));
    clearErrors((path) => path === "ingredients" || path.startsWith(`ingredients.${index}.`));
  };

  return (
    <form action={formAction} className="flex max-w-4xl flex-col gap-8" noValidate>
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TextField
          label="Nombre"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            clearField("name");
          }}
          error={errors.name}
        />
        <TextField
          label="Tiempo (minutos, opcional)"
          inputMode="numeric"
          value={prepMinutes}
          onChange={(event) => {
            setPrepMinutes(event.target.value);
            clearField("prepMinutes");
          }}
          error={errors.prepMinutes}
        />
      </div>

      <CategoryPicker value={category} onChange={setCategory} />

      <NumberStepper
        name="baseServings"
        label="¿Para cuántas porciones son estas cantidades?"
        defaultValue={baseServings}
        min={1}
        max={MAX_RECIPE_SERVINGS}
        unit={["porción", "porciones"]}
        onValueChange={setBaseServings}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">Ingredientes</legend>
        {errors.ingredients && <p className="text-sm text-danger">{errors.ingredients}</p>}
        <ul className="flex flex-col gap-3">
          {lines.map((line, index) => (
            <IngredientLineFields
              key={line.key}
              line={line}
              position={index + 1}
              ingredients={ingredients}
              errors={lineErrors(index)}
              canRemove={lines.length > 1}
              onChange={(next) => updateLine(index, next)}
              onRemove={() => {
                setLines((current) => current.filter((item) => item.key !== line.key));
                // Al quitar una fila cambian las posiciones; los errores de ingredientes ya no aplican.
                clearErrors((path) => path.startsWith("ingredients"));
              }}
            />
          ))}
        </ul>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-fit"
          disabled={lines.length >= MAX_RECIPE_INGREDIENTS}
          onClick={() => setLines((current) => [...current, emptyLine()])}
        >
          <Plus className="size-4" aria-hidden />
          Agregar ingrediente
        </Button>
      </fieldset>

      <StepsField
        value={steps}
        error={errors.steps}
        onChange={(next) => {
          setSteps(next);
          clearField("steps");
        }}
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {recipe ? "Guardar cambios" : "Crear receta"}
        </Button>
        <Link href={cancelHref} className={buttonClasses({ variant: "ghost" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
