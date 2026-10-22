import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RECIPE_CATEGORY_LABELS } from "@/domain/recipe-categories";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { RecipeActions } from "@/features/recipes/components/recipe-actions";
import { RecipeDetailSkeleton } from "@/features/recipes/components/recipe-detail-skeleton";
import { RecipeIngredients } from "@/features/recipes/components/recipe-ingredients";
import { getRecipe } from "@/features/recipes/data";

export const metadata: Metadata = { title: "Receta" };

async function RecipeDetailView({ params }: Pick<PageProps<"/recetas/[id]">, "params">) {
  const [{ id }, household] = await Promise.all([params, requireHousehold()]);
  const [recipe, { catalog, prices }] = await Promise.all([getRecipe(id), getCatalog()]);
  if (!recipe) notFound();

  // Solo viajan al navegador los ingredientes y precios de esta receta.
  const ids = new Set(recipe.ingredients.map((line) => line.ingredientId));
  const ingredients = [...ids].flatMap((ingredientId) => catalog.get(ingredientId) ?? []);
  const recipePrices = [...ids].flatMap((ingredientId) => prices.get(ingredientId) ?? []);

  return (
    <article className="flex animate-rise flex-col gap-10">
      <header className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {RECIPE_CATEGORY_LABELS[recipe.category]}
          {recipe.isOwn && " · Tuya"}
        </p>
        <h1 className="font-display text-title font-semibold text-balance md:text-display">{recipe.name}</h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {recipe.prepMinutes && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              {recipe.prepMinutes} min
            </span>
          )}
          <span>Receta base para {recipe.baseServings}</span>
        </p>
        <RecipeActions recipeId={recipe.id} recipeName={recipe.name} isOwn={recipe.isOwn} />
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <RecipeIngredients
          recipe={recipe}
          ingredients={ingredients}
          prices={recipePrices}
          defaultServings={household.defaultPeople}
          detail={household.preferences.detail}
        />
        <section aria-labelledby="steps-title" className="flex flex-col gap-5">
          <h2 id="steps-title" className="letrero text-xl">
            Preparación
          </h2>
          <ol className="flex flex-col gap-4">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span className="w-6 shrink-0 letrero text-2xl leading-none text-muted tabular-nums">
                  {index + 1}
                </span>
                <p className="text-[15px] leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}

export default function RecipePage({ params }: PageProps<"/recetas/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/recetas"
        className="flex w-fit items-center gap-1.5 rounded-md text-sm text-muted transition-colors duration-(--dur-fast) hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Recetas
      </Link>
      <Suspense fallback={<RecipeDetailSkeleton />}>
        <RecipeDetailView params={params} />
      </Suspense>
    </div>
  );
}
