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
 * Envía un correo con Resend. Devuelve false (y lo deja en los logs) si no está configurado o
 * falla: quien llama decide si eso importa, pero nunca rompe la acción de la persona.
 */
export async function sendEmail({ to, subject, text }: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[correo] Falta RESEND_API_KEY; no se envió:", subject);
    return false;
  }
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || DEFAULT_FROM, to, subject, text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return true;
    console.error("[correo]", response.status, await response.text());
  } catch (error) {
    console.error("[correo]", error);
  }
  return false;
}
