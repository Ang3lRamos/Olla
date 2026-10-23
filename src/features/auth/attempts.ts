import "server-only";
import { headers } from "next/headers";
import { AUTH_ATTEMPTS_PER_IP, withinRateLimit } from "@/lib/rate-limit";

/**
 * Frena la fuerza bruta contra el ingreso y el abuso de los correos de Supabase. Se cuenta por
 * IP: en Vercel la pone la plataforma en x-forwarded-for y el cliente no la puede falsear.
 */
export async function authAttemptAllowed(): Promise<boolean> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
  return withinRateLimit(`auth:${ip}`, AUTH_ATTEMPTS_PER_IP);
}
