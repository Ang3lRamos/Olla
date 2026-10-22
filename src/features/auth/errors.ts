import type { AuthError } from "@supabase/supabase-js";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "El correo o la contraseña no coinciden.",
  user_already_exists: "Ya existe una cuenta con ese correo. Intenta ingresar.",
  email_exists: "Ya existe una cuenta con ese correo. Intenta ingresar.",
  email_not_confirmed: "Confirma tu correo antes de ingresar; revisa tu bandeja de entrada.",
  weak_password: "Esa contraseña es muy fácil de adivinar. Prueba con una más larga.",
  over_request_rate_limit: "Hiciste muchos intentos seguidos. Espera un minuto y vuelve a probar.",
  over_email_send_rate_limit:
    "Por ahora no podemos enviar más correos. Espera unos minutos y vuelve a intentarlo.",
  same_password: "La nueva contraseña debe ser distinta a la que tenías.",
  signup_disabled: "El registro está desactivado por ahora.",
};

const UNAVAILABLE_MESSAGE =
  "El servicio de cuentas tardó demasiado en responder. Espera un momento y vuelve a intentarlo.";
const GENERIC_MESSAGE = "No pudimos completar la operación. Revisa tu conexión y vuelve a intentarlo.";

export function authErrorMessage(error: AuthError): string {
  const known = error.code ? MESSAGES[error.code] : undefined;
  if (known) return known;

  // Sin código conocido no hay mensaje útil para el usuario; queda en los logs del servidor.
  console.error("[auth]", {
    status: error.status,
    code: error.code,
    name: error.name,
    message: error.message,
  });
  return error.name === "AuthRetryableFetchError" || (error.status ?? 0) >= 500
    ? UNAVAILABLE_MESSAGE
    : GENERIC_MESSAGE;
}
