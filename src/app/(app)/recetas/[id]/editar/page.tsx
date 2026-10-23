import type { Metadata } from "next";
import { withoutNutrients } from "@/domain/nutrition";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { RecipeForm } from "@/features/recipes/components/recipe-form";
import { RecipeFormSkeleton } from "@/features/recipes/components/recipe-form-skeleton";
import { getRecipe } from "@/features/recipes/data";

export const metadata: Metadata = { title: "Editar receta" };

async function EditRecipeForm({ params }: Pick<PageProps<"/recetas/[id]/editar">, "params">) {
  const [{ id }] = await Promise.all([params, requireHousehold()]);
  const [recipe, { ingredients }] = await Promise.all([getRecipe(id), getCatalog()]);
  if (!recipe) notFound();
  // Las recetas del catálogo global no se editan: se duplican desde el detalle.
  if (!recipe.isOwn) redirect(`/recetas/${recipe.id}`);
  return (
    <RecipeForm
      ingredients={withoutNutrients(ingredients)}
      recipe={recipe}
      cancelHref={`/recetas/${recipe.id}`}
    />
  );
}

export default function EditRecipePage({ params }: PageProps<"/recetas/[id]/editar">) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-title font-semibold">Editar receta</h1>
      <Suspense fallback={<RecipeFormSkeleton />}>
        <EditRecipeForm params={params} />
      </Suspense>
    </div>
  );
}
