"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONFIRMATION_PATH, NEW_PASSWORD_PATH } from "./confirmation";
import { authErrorMessage } from "./errors";
import { credentialsSchema, newPasswordSchema } from "./schemas";

export interface ResetRequestState {
  /** Correo al que se envió el enlace; se muestra para confirmar adónde llegó. */
  sentTo?: string;
  email?: string;
  error?: string;
}

/**
 * Envía el enlace para elegir otra contraseña. Responde igual exista o no la cuenta, para no
 * revelar qué correos están registrados.
 */
export async function requestPasswordReset(
  _: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = credentialsSchema.shape.email.safeParse(formData.get("email"));
  if (!email.success)
    return { email: String(formData.get("email") ?? ""), error: "Escribe un correo válido." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}${CONFIRMATION_PATH}?siguiente=${NEW_PASSWORD_PATH}`,
  });
  if (error) {
    // authErrorMessage deja constancia de lo inesperado. Solo el límite de envíos se le cuenta a
    // la persona (tiene que esperar); lo demás no debe revelar si el correo existe.
    const message = authErrorMessage(error);
    if (error.code === "over_email_send_rate_limit") return { email: email.data, error: message };
  }
  return { sentTo: email.data };
}

export interface NewPasswordState {
  done?: boolean;
  error?: string;
  fieldErrors?: { password?: string; confirm?: string };
}

/** Cambia la contraseña con la sesión que abrió el enlace del correo. */
export async function updatePassword(_: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return { fieldErrors: { password: fieldErrors.password?.[0], confirm: fieldErrors.confirm?.[0] } };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) return { error: "El enlace venció. Pide uno nuevo desde «¿Olvidaste tu contraseña?»." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  return error ? { error: authErrorMessage(error) } : { done: true };
}
