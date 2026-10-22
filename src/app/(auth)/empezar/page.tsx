import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createHousehold } from "@/features/household/actions";
import { HouseholdForm } from "@/features/household/components/household-form";
import { HouseholdFormSkeleton } from "@/features/household/components/household-form-skeleton";
import { getCurrentHousehold, requireUser } from "@/features/household/data";

export const metadata: Metadata = { title: "Empezar" };

const NEW_HOUSEHOLD = { name: "", defaultPeople: 4, weeklyBudgetCop: null, exclude: [] };

async function OnboardingForm() {
  await requireUser();
  if (await getCurrentHousehold()) redirect("/");
  return <HouseholdForm action={createHousehold} defaults={NEW_HOUSEHOLD} submitLabel="Empezar a planear" />;
}

export default function OnboardingPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="letrero text-sm text-achiote">Paso único</p>
        <h1 className="font-display text-title font-semibold">Cuéntanos de tu casa</h1>
        <p className="text-muted">
          Con esto calculamos porciones y mercado. Lo puedes cambiar cuando quieras.
        </p>
      </div>
      <Suspense fallback={<HouseholdFormSkeleton />}>
        <OnboardingForm />
      </Suspense>
    </>
  );
}
