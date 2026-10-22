import type { Metadata } from "next";
import { Suspense } from "react";
import { getCatalog } from "@/features/catalog/data";
import { requireHousehold } from "@/features/household/data";
import { PantryManager } from "@/features/pantry/components/pantry-manager";
import { PantrySkeleton } from "@/features/pantry/components/pantry-skeleton";
import { listPantry } from "@/features/pantry/data";

export const metadata: Metadata = { title: "Despensa" };

async function Pantry() {
  await requireHousehold();
  const [items, { ingredients, prices }] = await Promise.all([listPantry(), getCatalog()]);
  // Solo las presentaciones con porciones sirven aquí: para mostrar "≈ 12 tajadas".
  const withPieces = [...prices.values()].filter((price) => price.pieces);
  return <PantryManager items={items} ingredients={ingredients} prices={withPieces} />;
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
