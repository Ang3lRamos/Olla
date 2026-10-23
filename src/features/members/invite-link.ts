import { z } from "zod";

export const JOIN_PATH = "/unirme";

/** Igual que household_member_limit() en la base, que es la que lo hace cumplir. */
export const HOUSEHOLD_MEMBER_LIMIT = 6;

export const inviteTokenSchema = z.uuid();

export const invitePath = (token: string) => `${JOIN_PATH}?codigo=${token}`;

/** El código de invitación que trae un `?siguiente=` (p. ej. tras registrarse), si lo trae. */
export function inviteTokenFrom(next: string | null | undefined): string | null {
  if (!next?.startsWith(`${JOIN_PATH}?`)) return null;
  const token = new URLSearchParams(next.slice(JOIN_PATH.length + 1)).get("codigo");
  return inviteTokenSchema.safeParse(token).success ? token : null;
}
