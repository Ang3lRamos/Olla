/**
 * Supabase Auth limita por IP (p. ej. 30 registros o recuperaciones cada 5 minutos). Como en
 * Olla esas llamadas las hace el servidor, sin esto todas las personas compartirían el cupo de
 * la IP de Vercel. Supabase acepta la IP real en Sb-Forwarded-For, pero solo con una llave
 * secreta nueva (sb_secret_…) y con "IP Address Forwarding" activado en el proyecto.
 */
export function authForwarding(
  clientIp: string | null,
  secretKey = process.env.SUPABASE_SECRET_KEY,
): { apiKey: string; headers: Record<string, string> } | null {
  if (!clientIp || !secretKey?.startsWith("sb_secret_")) return null;
  return { apiKey: secretKey, headers: { "sb-forwarded-for": clientIp } };
}

/** La IP de quien hace la petición; en Vercel la pone la plataforma y el cliente no la falsea. */
export const clientIpFrom = (forwardedFor: string | null) => forwardedFor?.split(",")[0]?.trim() || null;
