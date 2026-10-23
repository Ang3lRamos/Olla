import "server-only";
import { notFound } from "next/navigation";
import { getCurrentUser, requireUser } from "@/features/household/data";

/** Correos con acceso al panel, separados por coma en ADMIN_EMAILS. Sin la variable, nadie entra. */
function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdmin(): Promise<boolean> {
  const email = (await getCurrentUser())?.email?.toLowerCase();
  return email !== undefined && adminEmails().includes(email);
}

/** Para cualquier otra persona el panel no existe: 404, sin revelar que hay algo ahí. */
export async function requireAdmin() {
  const user = await requireUser();
  if (!(await isAdmin())) notFound();
  return user;
}
