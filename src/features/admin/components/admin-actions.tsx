"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/button";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import {
  adminApproveRefund,
  adminDeleteUser,
  adminRejectRefund,
  adminSetFree,
  type AdminResult,
} from "../actions";

interface Confirmation {
  title: string;
  description: string;
  confirmLabel: string;
  tone: "danger" | "primary";
  action: () => Promise<AdminResult>;
}

/** Botones de una fila que piden confirmación antes de tocar datos de otra persona. */
function ConfirmedActions({ actions }: { actions: Array<Confirmation & { label: string }> }) {
  const [current, setCurrent] = useState<Confirmation | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      if (!current) return;
      const result = await current.action();
      setError(result.ok ? undefined : result.error);
      setCurrent(null);
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex justify-end gap-1">
        {actions.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            size="sm"
            className={item.tone === "danger" ? "px-2 text-muted hover:text-danger" : "px-2"}
            onClick={() => setCurrent(item)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={current !== null}
        title={current?.title ?? ""}
        description={current?.description}
        confirmLabel={current?.confirmLabel ?? ""}
        dismissLabel="Volver"
        tone={current?.tone}
        pending={pending}
        onConfirm={confirm}
        onClose={() => setCurrent(null)}
      />
    </div>
  );
}

interface UserActionsProps {
  userId: string;
  email: string;
  householdId: string | null;
  onPaidPlan: boolean;
  isSelf: boolean;
}

export function UserActions({ userId, email, householdId, onPaidPlan, isSelf }: UserActionsProps) {
  const actions: Array<Confirmation & { label: string }> = [];
  if (householdId && onPaidPlan) {
    actions.push({
      label: "Pasar a Gratis",
      title: `¿Pasar a Gratis el hogar de ${email}?`,
      description: "El plan termina hoy. No devuelve dinero: si hubo reembolso, hazlo primero en Wompi.",
      confirmLabel: "Pasar a Gratis",
      tone: "primary",
      action: () => adminSetFree(householdId),
    });
  }
  if (!isSelf) {
    actions.push({
      label: "Borrar",
      title: `¿Borrar la cuenta de ${email}?`,
      description:
        "Se borran la cuenta y, si nadie más vive ahí, el hogar con sus recetas, semanas y notas. Los pagos se conservan por contabilidad. No se puede deshacer.",
      confirmLabel: "Borrar cuenta",
      tone: "danger",
      action: () => adminDeleteUser(userId),
    });
  }
  return actions.length ? <ConfirmedActions actions={actions} /> : null;
}

export function RefundActions({
  reference,
  amount,
  email,
}: {
  reference: string;
  amount: string;
  email: string;
}) {
  return (
    <ConfirmedActions
      actions={[
        {
          label: "Aprobar",
          title: `¿Ya devolviste ${amount} a ${email}?`,
          description:
            "Primero devuelve el dinero desde el panel de Wompi. Al aprobar, el pago queda como devuelto y el hogar pasa a Gratis.",
          confirmLabel: "Sí, aprobar",
          tone: "primary",
          action: () => adminApproveRefund(reference),
        },
        {
          label: "Descartar",
          title: "¿Descartar la solicitud?",
          description:
            "Úsalo si la persona desistió al hablar con soporte. Dentro de los 5 días hábiles el retracto es un derecho: no lo descartes sin su acuerdo.",
          confirmLabel: "Descartar",
          tone: "danger",
          action: () => adminRejectRefund(reference),
        },
      ]}
    />
  );
}
