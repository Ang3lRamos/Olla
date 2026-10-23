import type { Metadata } from "next";
import { Suspense } from "react";
import { formatCop } from "@/domain/money";
import { requireAdmin } from "@/features/admin/access";
import {
  PaymentsTable,
  RefundRequests,
  STATUS_LABELS,
  UsersTable,
} from "@/features/admin/components/admin-tables";
import { StatTile } from "@/features/admin/components/stat-tile";
import { TestEmail } from "@/features/admin/components/test-email";
import { TrendChart } from "@/features/admin/components/trend-chart";
import { loadAdminSnapshot } from "@/features/admin/data";
import { adminMetrics, type PlanStatus } from "@/features/admin/metrics";
import { readWompiConfig } from "@/lib/wompi/config";
import { Skeleton } from "@/ui/skeleton";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const RECENT_PAYMENTS = 25;
const PLAN_ORDER: PlanStatus[] = ["pro", "basic", "trial", "courtesy", "free"];

async function Dashboard() {
  const admin = await requireAdmin();
  const snapshot = await loadAdminSnapshot();
  if (!snapshot) {
    return (
      <p className="text-danger">Falta SUPABASE_SECRET_KEY: sin ella el panel no puede leer los datos.</p>
    );
  }
  const metrics = adminMetrics(snapshot, new Date());
  const { totals, plans } = metrics;
  const paying = plans.basic + plans.pro;
  const emailOf = new Map(
    snapshot.users.flatMap((user) => (user.householdId ? [[user.householdId, user.email] as const] : [])),
  );
  const sandbox = readWompiConfig()?.sandbox;

  return (
    <>
      {metrics.refundRequests.length > 0 && (
        <section aria-labelledby="refunds-title" className="flex flex-col gap-3">
          <h2 id="refunds-title" className="font-display text-xl font-semibold">
            Reembolsos por revisar ({metrics.refundRequests.length})
          </h2>
          <RefundRequests requests={metrics.refundRequests} emailOf={emailOf} />
        </section>
      )}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Usuarios"
          value={totals.users}
          detail={`+${totals.newUsers7} esta semana · +${totals.newUsers30} en 30 días`}
        />
        <StatTile
          label="Activos 7 días"
          value={totals.active7}
          detail={`${totals.unconfirmed} sin confirmar el correo`}
        />
        <StatTile
          label="Suscripciones pagas"
          value={paying}
          detail={`${plans.pro} Pro · ${plans.basic} Básico · ${plans.trial} en prueba`}
        />
        <StatTile
          label="Ingreso mensual (MRR)"
          value={formatCop(metrics.mrrCop)}
          detail="Trimestrales divididos en 3"
        />
        <StatTile
          label="Ingresos del mes"
          value={formatCop(metrics.revenueThisMonthCop)}
          detail={`${formatCop(metrics.revenueTotalCop)} desde el inicio${metrics.refundedCop ? ` · ${formatCop(metrics.refundedCop)} devueltos` : ""}`}
        />
        <StatTile
          label="Hogares"
          value={totals.households}
          detail={`${totals.users - totals.households} usuarios sin hogar`}
        />
        <StatTile
          label="Asistente hoy"
          value={metrics.aiToday}
          detail={`${metrics.ai30} consultas en 30 días`}
        />
        <StatTile
          label="Conversión a pago"
          value={totals.households ? `${Math.round((paying / totals.households) * 100)} %` : "—"}
          detail="Hogares que pagan hoy"
        />
      </dl>
      {sandbox && (
        <p className="text-sm text-muted">
          Wompi está en modo de pruebas: los pagos y los ingresos no son dinero real.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title="Registros"
          subtitle="Cuentas nuevas por día, últimos 30 días"
          points={metrics.signupSeries}
          unit="count"
        />
        <TrendChart
          title="Asistente"
          subtitle="Consultas por día, últimos 30 días"
          points={metrics.aiSeries}
          unit="count"
        />
        <TrendChart
          title="Ingresos"
          subtitle="Pagos aprobados por mes, últimos 6 meses"
          points={metrics.revenueSeries}
          unit="cop"
        />
        <section
          aria-labelledby="plans-title"
          className="flex flex-col gap-3 rounded-md border border-hairline p-4"
        >
          <h2 id="plans-title" className="font-medium">
            Hogares por plan
          </h2>
          <ul className="flex flex-col gap-2.5 text-sm">
            {PLAN_ORDER.map((status) => {
              const share = totals.households ? plans[status] / totals.households : 0;
              return (
                <li key={status} className="grid grid-cols-[6.5rem_minmax(0,1fr)_3rem] items-center gap-3">
                  <span>{STATUS_LABELS[status]}</span>
                  <span className="h-2 rounded-full bg-sunken">
                    <span
                      className="block h-full rounded-full bg-chart"
                      style={{ width: `${share * 100}%` }}
                    />
                  </span>
                  <span className="text-right tabular-nums">{plans[status]}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section aria-labelledby="users-title" className="flex flex-col gap-3">
        <h2 id="users-title" className="font-display text-xl font-semibold">
          Usuarios
        </h2>
        <UsersTable rows={metrics.userRows} households={snapshot.households} selfId={admin.id} />
      </section>

      <section aria-labelledby="payments-title" className="flex flex-col gap-3">
        <h2 id="payments-title" className="font-display text-xl font-semibold">
          Últimos pagos
        </h2>
        <PaymentsTable payments={snapshot.payments.slice(0, RECENT_PAYMENTS)} emailOf={emailOf} />
      </section>

      <section aria-labelledby="email-title" className="flex flex-col gap-2 border-t border-hairline pt-6">
        <h2 id="email-title" className="font-display text-xl font-semibold">
          Correo de avisos
        </h2>
        <p className="text-sm text-muted">
          Los avisos de reembolso llegan a ALERTS_EMAIL (o, si no está, al correo de contacto legal). Sin
          dominio propio, Resend solo envía al correo con el que creaste la cuenta de Resend.
        </p>
        <TestEmail />
      </section>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-64" />
        ))}
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-title font-semibold md:text-display">Admin</h1>
        <p className="max-w-2xl text-muted">
          Cómo va Olla: usuarios, suscripciones, ingresos y uso del asistente.
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
