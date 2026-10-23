import { formatCop } from "@/domain/money";
import type { Email } from "@/lib/email/send";

interface RefundNotice {
  supportEmail: string;
  customerEmail: string;
  amountCop: number;
  reference: string;
  deadline: string;
  adminUrl: string;
}

/** El aviso a soporte: lo necesario para escribirle a la persona y devolver en Wompi. */
export function refundNoticeEmail(notice: RefundNotice): Email {
  return {
    to: notice.supportEmail,
    subject: `Reembolso pedido: ${notice.customerEmail} (${formatCop(notice.amountCop)})`,
    text: [
      `${notice.customerEmail} pidió el reembolso de ${formatCop(notice.amountCop)}.`,
      `Referencia del pago: ${notice.reference}`,
      `Plazo de retracto hasta: ${notice.deadline}`,
      "",
      "Según la política, hay que escribirle en máximo 2 días hábiles para confirmar los datos de la devolución.",
      "Cuando devuelvas el dinero en Wompi, apruébalo en el panel:",
      notice.adminUrl,
    ].join("\n"),
  };
}
