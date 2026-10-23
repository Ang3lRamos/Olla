import type { Metadata } from "next";
import { withoutNutrients } from "@/domain/nutrition";
import { Suspense } from "react";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { RecipeForm } from "@/features/recipes/components/recipe-form";
import { RecipeFormSkeleton } from "@/features/recipes/components/recipe-form-skeleton";

export const metadata: Metadata = { title: "Nueva receta" };

async function NewRecipeForm() {
  await requireHousehold();
  const { ingredients } = await getCatalog();
  return <RecipeForm ingredients={withoutNutrients(ingredients)} cancelHref="/recetas" />;
}

export default function NewRecipePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-title font-semibold">Nueva receta</h1>
        <p className="text-muted">Las cantidades se escalan solas según las personas de cada comida.</p>
      </div>
      <Suspense fallback={<RecipeFormSkeleton />}>
        <NewRecipeForm />
      </Suspense>
    </div>
  );
}
