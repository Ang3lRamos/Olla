import type { Metadata } from "next";
import { Suspense } from "react";
import { updateHousehold } from "@/features/household/actions";
import { HouseholdForm } from "@/features/household/components/household-form";
import { HouseholdFormSkeleton } from "@/features/household/components/household-form-skeleton";
import { requireHousehold } from "@/features/household/data";
import { getAiQuota } from "@/features/entitlements/data";
import { GoalsForm } from "@/features/nutrition/components/goals-form";
import { getMyGoals } from "@/features/nutrition/data";
import Link from "next/link";
import { Skeleton } from "@/ui/skeleton";

export const metadata: Metadata = { title: "Ajustes" };

const LEGAL_LINKS = [
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/reembolsos", label: "Política de reembolsos" },
];

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

/** Metas nutricionales de la persona; son de los planes pagos, como la nutrición. */
async function Goals() {
  const household = await requireHousehold();
  const quota = await getAiQuota(household.id);
  if (quota.plan === "free") {
    return (
      <p className="rounded-md border border-dashed border-hairline-strong px-4 py-3 text-sm text-muted">
        Pon tus metas de calorías, proteína y más, y mira cada día cómo vas, en los{" "}
        <Link
          href="/planes"
          className="font-medium text-ink underline decoration-hairline-strong underline-offset-4"
        >
          planes Básico y Pro
        </Link>
        .
      </p>
    );
  }
  return <GoalsForm goals={await getMyGoals()} />;
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

      <section aria-labelledby="goals-title" className="flex flex-col gap-3 border-t border-hairline pt-8">
        <div className="flex flex-col gap-1">
          <h2 id="goals-title" className="font-display text-xl font-semibold">
            Mis metas de nutrición
          </h2>
          <p className="text-sm text-muted">Son tuyas, no del hogar: cada persona pone las suyas.</p>
        </div>
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <Goals />
        </Suspense>
      </section>

      <section aria-labelledby="legal-title" className="flex flex-col gap-2 border-t border-hairline pt-8">
        <h2 id="legal-title" className="font-display text-xl font-semibold">
          Tus datos y lo legal
        </h2>
        <p className="text-sm text-muted">
          Para conocer, corregir o borrar tus datos, o borrar la cuenta, escríbenos como explica la política
          de privacidad.
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {LEGAL_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="underline decoration-hairline-strong underline-offset-4 hover:decoration-ink"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
