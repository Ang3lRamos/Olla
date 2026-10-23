import "server-only";
import { notFound } from "next/navigation";
import { getCurrentUser, requireUser } from "@/features/household/data";
import { isAdminEmail } from "./emails";

export async function isAdmin(): Promise<boolean> {
  return isAdminEmail((await getCurrentUser())?.email);
}

/** Segunda barrera tras el proxy: sin acceso el panel no existe, sin revelar que hay algo ahí. */
export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) notFound();
  return user;
}
