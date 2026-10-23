import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlanManagement } from "@/features/billing/components/plan-management";
import { PlanPicker } from "@/features/billing/components/plan-picker";
import { PlanStatus } from "@/features/billing/components/plan-status";
import { getLastPayment, listPlanPrices } from "@/features/billing/data";
import { PLAN_NAMES } from "@/features/billing/plans";
import { refundWindow } from "@/features/billing/refund-window";
import { reconcilePendingPayments } from "@/features/billing/reconcile";
import { getAiQuota } from "@/features/entitlements/data";
import { requireHousehold } from "@/features/household/data";
import { readWompiConfig } from "@/lib/wompi/config";
import { Skeleton } from "@/ui/skeleton";

export const metadata: Metadata = { title: "Planes" };

async function Plans() {
  const household = await requireHousehold();
  await reconcilePendingPayments(household.id);
  const [quota, prices, lastPayment] = await Promise.all([
    getAiQuota(household.id),
    listPlanPrices(),
    getLastPayment(household.id),
  ]);
  const config = readWompiConfig();
  const now = new Date();
  // Un plan asignado a mano (sin vencimiento) no se administra desde aquí.
  const manageable = quota.plan !== "free" && quota.expiresAt !== null;

  return (
    <>
      <PlanStatus quota={quota} now={now} />
      <PlanPicker
        prices={prices}
        currentPlan={quota.plan}
        canStartTrial={!quota.trialUsed && quota.plan === "free"}
        paymentsEnabled={config !== null}
      />
      <p className="text-sm text-muted">
        Pagas en Wompi, de Bancolombia, con tarjeta, PSE, Nequi o botón Bancolombia; Olla no ve ni guarda tus
        datos de pago. El plan no se renueva solo: te avisamos antes de que venza. Al pagar aceptas los{" "}
        <Link href="/terminos" className="text-ink underline decoration-hairline-strong underline-offset-4">
          términos
        </Link>
        ; si te arrepientes, te devolvemos todo en los 5 días hábiles siguientes (
        <Link href="/reembolsos" className="text-ink underline decoration-hairline-strong underline-offset-4">
          reembolsos
        </Link>
        ).
        {config?.sandbox && " Modo de pruebas: no se cobra dinero real."}
      </p>
      {manageable && (
        <PlanManagement
          planName={PLAN_NAMES[quota.plan]}
          refund={
            lastPayment && {
              amountCop: lastPayment.amountCop,
              ...refundWindow(lastPayment.paidAt, now),
              requested: lastPayment.refundRequested,
            }
          }
        />
      )}
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
          Todo Olla es gratis, con un menú del asistente por semana. Los planes suman más consultas, ajustar
          el menú con tus palabras, revisar tus notas y la nutrición.
        </p>
      </div>
      <Suspense fallback={<PlansSkeleton />}>
        <Plans />
      </Suspense>
    </div>
  );
}
