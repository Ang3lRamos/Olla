import { formatCop } from "@/domain/money";
import { PERIOD_LABELS, PLAN_NAMES } from "@/features/billing/plans";
import { cn } from "@/ui/cn";
import type { AdminMetrics, AdminPayment, PlanStatus } from "../metrics";
import { RefundActions, UserActions } from "./admin-actions";

const DATE = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" });
const DATE_TIME = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export const STATUS_LABELS: Record<PlanStatus, string> = {
  free: "Gratis",
  basic: "Básico",
  pro: "Pro",
  trial: "Prueba Pro",
  courtesy: "Cortesía",
};

const PAYMENT_STATUS: Record<AdminPayment["status"], { label: string; tone: string }> = {
  APPROVED: { label: "Aprobado", tone: "text-cilantro" },
  PENDING: { label: "Pendiente", tone: "text-muted" },
  DECLINED: { label: "Rechazado", tone: "text-danger" },
  VOIDED: { label: "Anulado", tone: "text-muted" },
  ERROR: { label: "Error", tone: "text-danger" },
};

const TABLE = "w-full min-w-[44rem] text-left text-sm tabular-nums";
const HEAD = "border-b border-hairline text-xs text-muted [&_th]:px-3 [&_th]:py-2 [&_th]:font-normal";
const BODY = "divide-y divide-hairline [&_td]:px-3 [&_td]:py-2";

function PlanBadge({ status }: { status: PlanStatus }) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm border px-1.5 py-0.5 text-xs whitespace-nowrap",
        status === "free" ? "border-hairline text-muted" : "border-hairline-strong font-medium",
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function UsersTable({
  rows,
  households,
  selfId,
}: {
  rows: AdminMetrics["userRows"];
  households: Map<string, string>;
  selfId: string;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-hairline">
      <table className={TABLE}>
        <thead className={HEAD}>
          <tr>
            <th>Correo</th>
            <th>Hogar</th>
            <th>Plan</th>
            <th>Vence</th>
            <th className="text-right">Asistente 30 d</th>
            <th>Registro</th>
            <th>Último ingreso</th>
            <th>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className={BODY}>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="max-w-64 truncate">
                {row.email}
                {!row.confirmed && <span className="ml-2 text-xs text-muted">sin confirmar</span>}
              </td>
              <td className="max-w-40 truncate">
                {row.householdId ? (
                  (households.get(row.householdId) ?? "—")
                ) : (
                  <span className="text-muted">Sin hogar</span>
                )}
              </td>
              <td>
                <PlanBadge status={row.status} />
              </td>
              <td className="whitespace-nowrap text-muted">
                {row.status === "free" || !row.expiresAt ? "—" : DATE.format(new Date(row.expiresAt))}
              </td>
              <td className="text-right">{row.ai30}</td>
              <td className="whitespace-nowrap">{DATE.format(new Date(row.createdAt))}</td>
              <td className="whitespace-nowrap text-muted">
                {row.lastSignInAt ? DATE_TIME.format(new Date(row.lastSignInAt)) : "Nunca"}
              </td>
              <td>
                <UserActions
                  userId={row.id}
                  email={row.email}
                  householdId={row.householdId}
                  onPaidPlan={row.status !== "free"}
                  isSelf={row.id === selfId}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PaymentsTable({
  payments,
  emailOf,
}: {
  payments: AdminPayment[];
  emailOf: Map<string, string>;
}) {
  if (payments.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-hairline-strong px-4 py-3 text-sm text-muted">
        Aún no hay pagos.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border border-hairline">
      <table className={TABLE}>
        <thead className={HEAD}>
          <tr>
            <th>Fecha</th>
            <th>Hogar</th>
            <th>Plan</th>
            <th>Medio</th>
            <th className="text-right">Valor</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody className={BODY}>
          {payments.map((payment) => (
            <tr key={payment.reference}>
              <td className="whitespace-nowrap">{DATE_TIME.format(new Date(payment.createdAt))}</td>
              <td className="max-w-64 truncate">
                {(payment.householdId && emailOf.get(payment.householdId)) ?? "Hogar borrado"}
              </td>
              <td className="whitespace-nowrap">
                {PLAN_NAMES[payment.plan]} · {PERIOD_LABELS[payment.period].name.toLowerCase()}
              </td>
              <td className="text-muted">{payment.method ?? "—"}</td>
              <td className="text-right">{formatCop(payment.amountCop)}</td>
              <td className={cn("whitespace-nowrap", PAYMENT_STATUS[payment.status].tone)}>
                {PAYMENT_STATUS[payment.status].label}
                {payment.refundedAt ? (
                  <span className="block text-xs text-muted">Devuelto</span>
                ) : (
                  payment.refundRequestedAt && (
                    <span className="block text-xs text-muted">Reembolso pedido</span>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lo que soporte tiene que resolver: escribirle a la persona, devolver en Wompi y aprobar. */
export function RefundRequests({
  requests,
  emailOf,
}: {
  requests: AdminPayment[];
  emailOf: Map<string, string>;
}) {
  return (
    <ul className="flex flex-col divide-y divide-hairline rounded-md border border-maiz bg-maiz/10">
      {requests.map((payment) => {
        const email = (payment.householdId && emailOf.get(payment.householdId)) ?? "Hogar borrado";
        const amount = formatCop(payment.amountCop);
        return (
          <li
            key={payment.reference}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span className="flex flex-col gap-0.5">
              <span>
                <a
                  href={`mailto:${email}`}
                  className="font-medium underline decoration-hairline-strong underline-offset-4"
                >
                  {email}
                </a>{" "}
                · {PLAN_NAMES[payment.plan]} · {amount}
              </span>
              <span className="text-xs text-muted">
                Pagó el {DATE_TIME.format(new Date(payment.createdAt))} · pidió el{" "}
                {DATE_TIME.format(new Date(payment.refundRequestedAt!))} · {payment.method ?? "—"} · ref.{" "}
                {payment.reference}
              </span>
            </span>
            <RefundActions reference={payment.reference} amount={amount} email={email} />
          </li>
        );
      })}
    </ul>
  );
}
