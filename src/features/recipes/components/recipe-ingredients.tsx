"use client";

import { useMemo, useState } from "react";
import { buildCatalog, getIngredient } from "@/domain/catalog";
import { quantityCost, recipeCost } from "@/domain/costs";
import { exactBaseQuantity, isSeasoning, toKitchenQuantity, type DetailLevel } from "@/domain/detail-level";
import { formatRecipeQuantity } from "@/domain/kitchen-format";
import { recipeNutrition } from "@/domain/nutrition";
import { formatCop } from "@/domain/money";
import { scaleRecipe } from "@/domain/scaling";
import type { Ingredient, IngredientPrice } from "@/domain/types";
import { formatQuantity, toIngredientBase } from "@/domain/units";
import { NumberStepper } from "@/ui/number-stepper";
import type { RecipeDetail } from "../types";
import { MAX_RECIPE_SERVINGS } from "../schemas";
import { RecipeNutrition, RecipeNutritionTeaser } from "./recipe-nutrition";

interface RecipeIngredientsProps {
  recipe: RecipeDetail;
  ingredients: Ingredient[];
  prices: IngredientPrice[];
  defaultServings: number;
  detail: DetailLevel;
  /** Nutrición por porción: es de los planes pagos. */
  showNutrition: boolean;
}

/** Ingredientes escalados en vivo con su costo; la cuenta la hace el dominio, no la UI. */
export function RecipeIngredients({
  recipe,
  ingredients,
  prices,
  defaultServings,
  detail,
  showNutrition,
}: RecipeIngredientsProps) {
  const [servings, setServings] = useState(defaultServings);
  const catalog = useMemo(() => buildCatalog(ingredients), [ingredients]);
  const priceList = useMemo(() => new Map(prices.map((price) => [price.ingredientId, price])), [prices]);

  const scaled = scaleRecipe(recipe, servings).map((line, index) => ({
    ...line,
    ingredient: getIngredient(catalog, line.ingredientId),
    note: recipe.ingredients[index]?.note,
  }));
  const total = recipeCost(recipe, servings, catalog, priceList);
  // En modo sencillo los condimentos van juntos "al gusto"; su costo sí cuenta en el total.
  const simple = detail === "simple";
  const main = simple ? scaled.filter((line) => !isSeasoning(line.ingredient)) : scaled;
  const seasonings = simple ? scaled.filter((line) => isSeasoning(line.ingredient)) : [];

  return (
    <section aria-labelledby="ingredients-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="ingredients-title" className="letrero text-xl">
          Ingredientes
        </h2>
        <NumberStepper
          name="servings"
          label="Porciones"
          defaultValue={defaultServings}
          min={1}
          max={MAX_RECIPE_SERVINGS}
          unit={["porción", "porciones"]}
          onValueChange={setServings}
        />
      </div>

      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {main.map(({ ingredient, quantity, note }, index) => {
          const cost = quantityCost(
            toIngredientBase(quantity, ingredient),
            ingredient,
            priceList.get(ingredient.id),
          );
          const shown = simple ? toKitchenQuantity(quantity, ingredient) : quantity;
          const exact = simple ? null : exactBaseQuantity(quantity, ingredient);
          return (
            <li
              key={`${ingredient.id}-${index}`}
              className="flex items-baseline justify-between gap-4 py-2.5"
            >
              <span className="flex flex-col">
                <span>
                  <span className="font-medium tabular-nums">{formatRecipeQuantity(shown)}</span>{" "}
                  {ingredient.name.toLocaleLowerCase("es")}
                  {exact && (
                    <span className="text-sm text-muted tabular-nums"> ({formatQuantity(exact)})</span>
                  )}
                </span>
                {note && <span className="text-sm text-muted">{note}</span>}
              </span>
              <span className="shrink-0 text-sm text-muted tabular-nums">
                {cost === null ? "sin precio" : formatCop(cost)}
              </span>
            </li>
          );
        })}
        {seasonings.length > 0 && (
          <li className="flex flex-col py-2.5">
            <span>
              <span className="font-medium">Para sazonar:</span>{" "}
              {seasonings.map((line) => line.ingredient.name.toLocaleLowerCase("es")).join(", ")}
            </span>
            <span className="text-sm text-muted">Al gusto. En el modo detallado ves cuánto de cada uno.</span>
          </li>
        )}
      </ul>

      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-muted">Costo estimado</dt>
          <dd className="letrero text-3xl tabular-nums">{formatCop(total.totalCop)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Por porción</dt>
          <dd className="letrero text-3xl tabular-nums">{formatCop(total.totalCop / servings)}</dd>
        </div>
      </dl>
      {showNutrition ? (
        <RecipeNutrition {...recipeNutrition(recipe, servings, catalog)} />
      ) : (
        <RecipeNutritionTeaser />
      )}
      {total.unpricedIngredientIds.length > 0 && (
        <p className="text-sm text-muted">
          Faltan precios de {total.unpricedIngredientIds.length} ingrediente(s); el costo real será mayor.
        </p>
      )}
    </section>
  );
}
