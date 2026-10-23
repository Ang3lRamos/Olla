import type { Metadata } from "next";
import { withoutNutrients } from "@/domain/nutrition";
import { Suspense } from "react";
import { OwnProducts } from "@/features/catalog/components/own-products";
import { getCatalog } from "@/features/catalog/data";
import { getAiQuota } from "@/features/entitlements/data";
import { requireHousehold } from "@/features/household/data";
import { PantryManager } from "@/features/pantry/components/pantry-manager";
import { PantrySkeleton } from "@/features/pantry/components/pantry-skeleton";
import { listPantry } from "@/features/pantry/data";

export const metadata: Metadata = { title: "Despensa" };

async function Pantry() {
  const household = await requireHousehold();
  const [items, { ingredients, prices }, quota] = await Promise.all([
    listPantry(),
    getCatalog(),
    getAiQuota(household.id),
  ]);
  const showNutrition = quota.plan !== "free";
  const ownProducts = ingredients.filter((ingredient) => ingredient.own);
  // Solo las presentaciones con porciones sirven aquí: para mostrar "≈ 12 tajadas".
  const withPieces = [...prices.values()].filter((price) => price.pieces);
  return (
    <>
      <PantryManager items={items} ingredients={withoutNutrients(ingredients)} prices={withPieces} />
      <OwnProducts
        products={showNutrition ? ownProducts : withoutNutrients(ownProducts)}
        showNutrition={showNutrition}
      />
    </>
  );
}

export default function PantryPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-title font-semibold md:text-display">Despensa</h1>
        <p className="max-w-2xl text-muted">
          Lo que ya tienes en casa. Las cantidades pueden ser aproximadas: sirven para no comprar de más.
        </p>
      </div>
      <Suspense fallback={<PantrySkeleton />}>
        <Pantry />
      </Suspense>
    </div>
  );
}
