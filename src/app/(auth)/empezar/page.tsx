import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createHousehold } from "@/features/household/actions";
import { HouseholdForm } from "@/features/household/components/household-form";
import { HouseholdFormSkeleton } from "@/features/household/components/household-form-skeleton";
import { getCurrentHousehold, getPendingInvite, requireUser } from "@/features/household/data";
import { previewInvite } from "@/features/members/data";
import { invitePath } from "@/features/members/invite-link";
import { HOME_PATH } from "@/lib/routes";

export const metadata: Metadata = { title: "Empezar" };

const NEW_HOUSEHOLD = {
  name: "",
  defaultPeople: 4,
  weeklyBudgetCop: null,
  exclude: [],
  detail: "simple" as const,
};

async function OnboardingForm() {
  await requireUser();
  if (await getCurrentHousehold()) redirect(HOME_PATH);
  // Quien se registró desde una invitación llega aquí al confirmar el correo: se le lleva a
  // aceptarla. Si ya venció o se usó, arma su propio hogar como cualquiera.
  const invite = await getPendingInvite();
  if (invite && (await previewInvite(invite))) redirect(invitePath(invite));
  return <HouseholdForm action={createHousehold} defaults={NEW_HOUSEHOLD} submitLabel="Empezar a planear" />;
}

export default function OnboardingPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="letrero text-sm text-muted">Paso único</p>
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
