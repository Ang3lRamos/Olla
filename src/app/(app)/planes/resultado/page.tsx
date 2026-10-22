import { CircleCheck, Clock, CircleX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { applyTransaction } from "@/features/billing/apply-payment";
import { formatPlanDate } from "@/features/billing/components/plan-status";
import { PLAN_NAMES } from "@/features/billing/plans";
import { PLANS } from "@/features/entitlements/quota";
import { requireHousehold } from "@/features/household/data";
import { getTransaction } from "@/lib/wompi/client";
import { readWompiConfig } from "@/lib/wompi/config";
import { buttonClasses } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";

export const metadata: Metadata = { title: "Resultado del pago" };

function Outcome({
  icon,
  title,
  body,
  actions,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  actions: ReactNode;
}) {
  return (
    <div className="flex max-w-xl animate-rise flex-col items-start gap-4">
      {icon}
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-title font-semibold">{title}</h1>
        <p className="text-muted">{body}</p>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

const planName = (plan: string | null) =>
  plan && (PLANS as readonly string[]).includes(plan) ? PLAN_NAMES[plan as (typeof PLANS)[number]] : "";

/**
 * Wompi devuelve aquí con ?id=<transacción>. El estado se pregunta a Wompi desde el servidor
 * (la URL sola no prueba nada) y se aplica igual que el aviso, por si este llega tarde.
 */
async function PaymentResult({ searchParams }: Pick<PageProps<"/planes/resultado">, "searchParams">) {
  await requireHousehold();
  const { id } = await searchParams;
  const config = readWompiConfig();
  const transaction = config && typeof id === "string" ? await getTransaction(config, id) : null;
  const applied = transaction ? await applyTransaction(transaction) : null;
  const backToPlans = (
    <Link href="/planes" className={buttonClasses({ variant: "secondary" })}>
      Volver a planes
    </Link>
  );

  if (!transaction) {
    return (
      <Outcome
        icon={<CircleX className="size-8 text-muted" aria-hidden />}
        title="No encontramos ese pago"
        body="Si pagaste y no ves tu plan activo en unos minutos, escríbenos con el comprobante de Wompi."
        actions={backToPlans}
      />
    );
  }
  if (transaction.status === "APPROVED") {
    return (
      <Outcome
        icon={<CircleCheck className="size-8 text-cilantro" aria-hidden />}
        title={`¡Listo! Ya tienes ${planName(applied?.plan ?? null) || "tu plan"}`}
        body={
          applied?.expiresAt
            ? `Tu plan está activo hasta el ${formatPlanDate(applied.expiresAt)}. Ya puedes pedirle el menú al asistente.`
            : "Tu pago quedó aprobado. En unos segundos verás el plan activo."
        }
        actions={
          <Link href="/semana" className={buttonClasses({})}>
            Ir a mi semana
          </Link>
        }
      />
    );
  }
  if (transaction.status === "PENDING") {
    return (
      <Outcome
        icon={<Clock className="size-8 text-maiz" aria-hidden />}
        title="Tu pago está en proceso"
        body="Con PSE el banco puede tardar unos minutos en confirmar. Activamos tu plan apenas Wompi nos avise; no tienes que pagar de nuevo."
        actions={
          <>
            <Link
              href={`/planes/resultado?id=${encodeURIComponent(transaction.id)}`}
              className={buttonClasses({})}
            >
              Revisar de nuevo
            </Link>
            {backToPlans}
          </>
        }
      />
    );
  }
  return (
    <Outcome
      icon={<CircleX className="size-8 text-danger" aria-hidden />}
      title="El pago no se aprobó"
      body="No se te cobró nada. Puedes intentar de nuevo con otro medio de pago."
      actions={
        <Link href="/planes" className={buttonClasses({})}>
          Intentar de nuevo
        </Link>
      }
    />
  );
}

export default function PaymentResultPage({ searchParams }: PageProps<"/planes/resultado">) {
  return (
    <Suspense
      fallback={
        <div className="flex max-w-xl flex-col gap-4" aria-label="Revisando el pago">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-full" />
        </div>
      }
    >
      <PaymentResult searchParams={searchParams} />
    </Suspense>
  );
}
