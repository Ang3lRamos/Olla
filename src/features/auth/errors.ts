import type { AuthError } from "@supabase/supabase-js";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "El correo o la contraseña no coinciden.",
  user_already_exists: "Ya existe una cuenta con ese correo. Intenta ingresar.",
  email_exists: "Ya existe una cuenta con ese correo. Intenta ingresar.",
  email_not_confirmed: "Confirma tu correo antes de ingresar; revisa tu bandeja de entrada.",
  weak_password: "Esa contraseña es muy fácil de adivinar. Prueba con una más larga.",
  over_request_rate_limit: "Hiciste muchos intentos seguidos. Espera un minuto y vuelve a probar.",
  over_email_send_rate_limit: "Se enviaron muchos correos seguidos. Espera unos minutos.",
  signup_disabled: "El registro está desactivado por ahora.",
};

export function authErrorMessage(error: AuthError): string {
  return (
    (error.code && MESSAGES[error.code]) ??
    "No pudimos completar la operación. Revisa tu conexión y vuelve a intentarlo."
  );
}
