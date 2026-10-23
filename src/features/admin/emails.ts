/** Correos con acceso al panel, separados por coma en ADMIN_EMAILS. Sin la variable, nadie entra. */
export function isAdminEmail(email: string | null | undefined, list = process.env.ADMIN_EMAILS): boolean {
  if (!email) return false;
  const admins = (list ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
