import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { RecipeBrowser } from "@/features/recipes/components/recipe-browser";
import { RecipeBrowserSkeleton } from "@/features/recipes/components/recipe-browser-skeleton";
import { listRecipes, summarizeRecipe } from "@/features/recipes/data";
import { buttonClasses } from "@/ui/button";

export const metadata: Metadata = { title: "Recetas" };

async function Recipes() {
  await requireHousehold();
  const [recipes, { catalog, prices }] = await Promise.all([listRecipes(), getCatalog()]);
  return <RecipeBrowser recipes={recipes.map((recipe) => summarizeRecipe(recipe, catalog, prices))} />;
}

export default function RecipesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-title font-semibold md:text-display">Recetas</h1>
          <p className="text-muted">
            El catálogo de la casa. Los costos usan los precios que tengas guardados.
          </p>
        </div>
        <Link href="/recetas/nueva" className={buttonClasses({ size: "sm" })}>
          <Plus className="size-4" aria-hidden />
          Nueva receta
        </Link>
      </div>
      <Suspense fallback={<RecipeBrowserSkeleton />}>
        <Recipes />
      </Suspense>
    </div>
  );
}
