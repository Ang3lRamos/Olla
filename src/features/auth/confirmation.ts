export const CONFIRMATION_PATH = "/auth/confirmar";
/** Adónde lleva el enlace para cambiar la contraseña, una vez abierta la sesión. */
export const NEW_PASSWORD_PATH = "/nueva-contrasena";
export const INVALID_LINK_ERROR = "enlace-invalido";

const EMAIL_LINK_TYPES = ["signup", "email", "email_change", "recovery"] as const;
type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];

export type ConfirmationRequest = (
  { kind: "code"; code: string } | { kind: "token-hash"; tokenHash: string; type: EmailLinkType }
) & {
  /** Si el enlace era para cambiar la contraseña, se sigue a esa pantalla y no al onboarding. */
  recovery: boolean;
};

/**
 * Supabase envía el enlace de confirmación en dos formatos: `?code=` (plantilla por defecto,
 * requiere el mismo navegador del registro) o `?token_hash=&type=` (plantilla para SSR,
 * funciona desde cualquier dispositivo).
 */
export function parseConfirmationRequest(params: URLSearchParams): ConfirmationRequest | null {
  // Con la plantilla por defecto, Supabase conserva el ?siguiente= que se pidió al enviarlo.
  const toNewPassword = params.get("siguiente") === NEW_PASSWORD_PATH;
  const code = params.get("code");
  if (code) return { kind: "code", code, recovery: toNewPassword };

  const tokenHash = params.get("token_hash");
  const type = EMAIL_LINK_TYPES.find((allowed) => allowed === params.get("type"));
  if (tokenHash && type)
    return { kind: "token-hash", tokenHash, type, recovery: toNewPassword || type === "recovery" };

  return null;
}
