import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { publicEnv } from "../env";
import type { Database } from "./database.types";
import { authForwarding, clientIpFrom } from "./forwarded-ip";

/** Cliente por petición con la sesión del usuario; la RLS decide qué puede leer y escribir. */
export async function createSupabaseServerClient() {
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/**
 * Solo para `supabase.auth.*` (ingresar, registrarse, recuperar, confirmar): le pasa a Supabase
 * la IP de la persona para que el límite de intentos sea suyo y no el de la IP del servidor.
 * Puede ir con la llave secreta, que salta la RLS: nunca se usa para leer ni escribir datos.
 */
export async function createSupabaseAuthClient() {
  const forwarding = authForwarding(clientIpFrom((await headers()).get("x-forwarded-for")));
  return forwarding
    ? createClient(forwarding.apiKey, forwarding.headers)
    : createClient(publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

async function createClient(apiKey: string, extraHeaders?: Record<string, string>) {
  // La sesión solo existe en una petición real: el cliente de Supabase usa la hora actual para
  // validarla, y Next no la permite en los prerenderizados (shell estático, prefetch).
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, apiKey, {
    global: extraHeaders ? { headers: extraHeaders } : undefined,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Los Server Components no pueden escribir cookies; el proxy ya refresca la sesión.
        }
      },
    },
  });
}
