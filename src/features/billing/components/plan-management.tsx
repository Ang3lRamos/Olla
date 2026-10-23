"use client";

import { useState, useTransition } from "react";
import { formatCop } from "@/domain/money";
import { Button } from "@/ui/button";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { FormMessage } from "@/ui/form-message";
import { cancelPlan, requestRefund } from "../cancel-actions";

const DAY = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", timeZone: "UTC" });

export interface RefundOption {
  amountCop: number;
  /** Último día para pedirlo, "aaaa-mm-dd" en Colombia. */
  deadline: string;
  open: boolean;
  requested: boolean;
}

interface PlanManagementProps {
  planName: string;
  refund: RefundOption | null;
}

type Dialog = "cancel" | "refund" | null;

/** Cancelar el plan (sin reembolso) o pedir el reembolso dentro del retracto, que revisa soporte. */
export function PlanManagement({ planName, refund }: PlanManagementProps) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string }>();
  const [pending, startTransition] = useTransition();
  const canRequestRefund = refund?.open && !refund.requested;

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await action();
      setDialog(null);
      setMessage(
        result.ok ? { tone: "success", text: success } : { tone: "error", text: result.error ?? "" },
      );
    });

  return (
    <section
      aria-labelledby="manage-title"
      className="flex max-w-2xl flex-col gap-3 border-t border-hairline pt-6"
    >
      <h2 id="manage-title" className="font-medium">
        Administrar tu plan
      </h2>
      {refund?.requested ? (
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">Tu solicitud de reembolso está en revisión.</span> Soporte te
          escribe a tu correo para confirmar y coordinar la devolución. Mientras tanto tu plan sigue activo.
        </p>
      ) : (
        canRequestRefund && (
          <p className="text-sm text-muted">
            Pagaste hace poco: hasta el {DAY.format(new Date(`${refund.deadline}T12:00:00Z`))} puedes pedir
            que te devolvamos los {formatCop(refund.amountCop)}.
          </p>
        )
      )}
      <div className="flex flex-wrap gap-2">
        {canRequestRefund && (
          <Button variant="secondary" size="sm" onClick={() => setDialog("refund")}>
            Pedir reembolso
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-muted hover:text-danger"
          onClick={() => setDialog("cancel")}
        >
          Cancelar plan
        </Button>
      </div>
      {message && (
        <FormMessage tone={message.tone} className="border-transparent px-0 py-0">
          {message.text}
        </FormMessage>
      )}

      <ConfirmDialog
        open={dialog === "refund"}
        title="¿Pedir el reembolso?"
        description={
          <p>
            Soporte revisa tu solicitud y te escribe a tu correo en máximo 2 días hábiles para confirmar los
            datos de la devolución. Cuando se apruebe, tu hogar vuelve a Gratis. Mientras tanto, tu plan sigue
            activo.
          </p>
        }
        confirmLabel="Enviar solicitud"
        dismissLabel="Volver"
        tone="primary"
        pending={pending}
        onConfirm={() => run(requestRefund, "Recibimos tu solicitud. Soporte te escribirá a tu correo.")}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "cancel"}
        title={`¿Cancelar el plan ${planName}?`}
        description={
          <p>
            Tu hogar vuelve hoy a Gratis: pierdes el asistente y la nutrición, pero no tus recetas ni tus
            datos. Cancelar no devuelve el dinero
            {canRequestRefund ? "; si lo quieres de vuelta, pide el reembolso." : "."} Recuerda que el plan no
            se cobra solo: si no haces nada, termina en su fecha.
          </p>
        }
        confirmLabel="Cancelar plan"
        dismissLabel="Volver"
        pending={pending}
        onConfirm={() => run(cancelPlan, "Cancelamos tu plan. Tu hogar está en el plan Gratis.")}
        onClose={() => setDialog(null)}
      />
    </section>
  );
}
