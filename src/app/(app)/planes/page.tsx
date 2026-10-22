import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanPicker } from "@/features/billing/components/plan-picker";
import { PlanStatus } from "@/features/billing/components/plan-status";
import { listPlanPrices } from "@/features/billing/data";
import { reconcilePendingPayments } from "@/features/billing/reconcile";
import { getAiQuota } from "@/features/entitlements/data";
import { requireHousehold } from "@/features/household/data";
import { readWompiConfig } from "@/lib/wompi/config";
import { Skeleton } from "@/ui/skeleton";

export const metadata: Metadata = { title: "Planes" };

async function Plans() {
  const household = await requireHousehold();
  await reconcilePendingPayments(household.id);
  const [quota, prices] = await Promise.all([getAiQuota(household.id), listPlanPrices()]);
  const config = readWompiConfig();

  return (
    <>
      <PlanStatus quota={quota} now={new Date()} />
      <PlanPicker
        prices={prices}
        currentPlan={quota.plan}
        canStartTrial={!quota.trialUsed && quota.plan === "free"}
        paymentsEnabled={config !== null}
      />
      <p className="max-w-2xl text-sm text-muted">
        Pagas en Wompi, de Bancolombia, con tarjeta, PSE, Nequi o botón Bancolombia; Olla no ve ni guarda tus
        datos de pago. El plan no se renueva solo: te avisamos antes de que venza.
        {config?.sandbox && " Modo de pruebas: no se cobra dinero real."}
      </p>
    </>
  );
}

function PlansSkeleton() {
  return (
    <>
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-80" />
        ))}
      </div>
    </>
  );
}

export default function PlansPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-title font-semibold md:text-display">Planes</h1>
        <p className="max-w-2xl text-muted">
          Todo Olla es gratis. Los planes suman el asistente que propone el menú, lo ajusta con tus palabras y
          lee tus notas.
        </p>
      </div>
      <Suspense fallback={<PlansSkeleton />}>
        <Plans />
      </Suspense>
    </div>
  );
}
