export const CONFIRMATION_PATH = "/auth/confirmar";
export const INVALID_LINK_ERROR = "enlace-invalido";

const EMAIL_LINK_TYPES = ["signup", "email", "email_change"] as const;
type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];

export type ConfirmationRequest =
  { kind: "code"; code: string } | { kind: "token-hash"; tokenHash: string; type: EmailLinkType };

/**
 * Supabase envía el enlace de confirmación en dos formatos: `?code=` (plantilla por defecto,
 * requiere el mismo navegador del registro) o `?token_hash=&type=` (plantilla para SSR,
 * funciona desde cualquier dispositivo).
 */
export function parseConfirmationRequest(params: URLSearchParams): ConfirmationRequest | null {
  const code = params.get("code");
  if (code) return { kind: "code", code };

  const tokenHash = params.get("token_hash");
  const type = EMAIL_LINK_TYPES.find((allowed) => allowed === params.get("type"));
  if (tokenHash && type) return { kind: "token-hash", tokenHash, type };

  return null;
}
