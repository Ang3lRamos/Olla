import type { Metadata } from "next";
import { Suspense } from "react";
import { updateHousehold } from "@/features/household/actions";
import { HouseholdForm } from "@/features/household/components/household-form";
import { HouseholdFormSkeleton } from "@/features/household/components/household-form-skeleton";
import { requireHousehold } from "@/features/household/data";

export const metadata: Metadata = { title: "Ajustes" };

async function HouseholdSettings() {
  const household = await requireHousehold();
  return (
    <HouseholdForm
      action={updateHousehold}
      defaults={{
        name: household.name,
        defaultPeople: household.defaultPeople,
        weeklyBudgetCop: household.weeklyBudgetCop,
        exclude: household.preferences.exclude,
        detail: household.preferences.detail,
      }}
      submitLabel="Guardar cambios"
    />
  );
}

export default function SettingsPage() {
  return (
    <div className="flex max-w-xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-title font-semibold">Ajustes del hogar</h1>
        <p className="text-muted">Estos datos se usan para calcular porciones, mercado y presupuesto.</p>
      </div>
      <Suspense fallback={<HouseholdFormSkeleton />}>
        <HouseholdSettings />
      </Suspense>
    </div>
  );
}
