import type { Metadata } from "next";
import { Suspense } from "react";
import { updateHousehold } from "@/features/household/actions";
import { HouseholdForm } from "@/features/household/components/household-form";
import { HouseholdFormSkeleton } from "@/features/household/components/household-form-skeleton";
import { requireHousehold, requireUser } from "@/features/household/data";
import { DeleteAccount } from "@/features/account/components/delete-account";
import { getAiQuota, hasPaidPlan } from "@/features/entitlements/data";
import { HouseholdMembers } from "@/features/members/components/household-members";
import { listInvites, listMembers } from "@/features/members/data";
import { HOUSEHOLD_MEMBER_LIMIT } from "@/features/members/invite-link";
import { headers } from "next/headers";
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

async function Members() {
  const [household, user] = await Promise.all([requireHousehold(), requireUser()]);
  const [members, invites, canInvite, requestHeaders] = await Promise.all([
    listMembers(household.id),
    listInvites(household.id),
    hasPaidPlan(household.id),
    headers(),
  ]);
  const host = requestHeaders.get("host") ?? "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return (
    <HouseholdMembers
      members={members}
      invites={invites}
      currentUserId={user.id}
      canInvite={canInvite}
      limit={HOUSEHOLD_MEMBER_LIMIT}
      origin={`${protocol}://${host}`}
    />
  );
}

async function AccountDeletion() {
  const user = await requireUser();
  return user.email ? <DeleteAccount email={user.email} /> : null;
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

      <section aria-labelledby="members-title" className="flex flex-col gap-3 border-t border-hairline pt-8">
        <div className="flex flex-col gap-1">
          <h2 id="members-title" className="font-display text-xl font-semibold">
            Personas del hogar
          </h2>
          <p className="text-sm text-muted">Comparten la semana, el mercado, la despensa y el plan.</p>
        </div>
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <Members />
        </Suspense>
      </section>

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
          Para conocer o corregir tus datos, escríbenos como explica la política de privacidad. Tu cuenta la
          puedes eliminar tú mismo aquí abajo.
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
        <Suspense fallback={null}>
          <AccountDeletion />
        </Suspense>
      </section>
    </div>
  );
}
