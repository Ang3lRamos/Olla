import "server-only";

const RESEND_URL = "https://api.resend.com/emails";
// Sin dominio propio verificado, Resend solo envía desde su remitente de pruebas y únicamente al
// correo de la cuenta; con dominio basta cambiar EMAIL_FROM.
const DEFAULT_FROM = "Olla <onboarding@resend.dev>";

export interface Email {
  to: string;
  subject: string;
  text: string;
}

/**
 * Adónde llegan los avisos internos (p. ej. "reembolso pedido"). Va aparte del contacto público
 * de los textos legales: sin dominio propio, Resend solo envía al correo de su cuenta.
 */
export const alertsEmail = () => process.env.ALERTS_EMAIL || process.env.LEGAL_CONTACT_EMAIL || null;

export type SendResult = { ok: true } | { ok: false; error: string };

/**
 * Envía un correo con Resend. Si no está configurado o falla, lo deja en los logs y devuelve el
 * motivo: quien llama decide si mostrarlo, pero nunca rompe la acción de la persona.
 */
export async function sendEmail({ to, subject, text }: Email): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[correo] Falta RESEND_API_KEY; no se envió:", subject);
    return { ok: false, error: "Falta RESEND_API_KEY en el servidor." };
  }
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || DEFAULT_FROM, to, subject, text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return { ok: true };
    const detail = await response.text();
    console.error("[correo]", response.status, detail);
    return { ok: false, error: `Resend respondió ${response.status}: ${detail}` };
  } catch (error) {
    console.error("[correo]", error);
    return { ok: false, error: "No se pudo conectar con Resend." };
  }
}
