import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { publicEnv } from "../env";
import type { Database } from "./database.types";

/** Cliente por petición con la sesión del usuario; la RLS decide qué puede leer y escribir. */
export async function createSupabaseServerClient() {
  // La sesión solo existe en una petición real: el cliente de Supabase usa la hora actual para
  // validarla, y Next no la permite en los prerenderizados (shell estático, prefetch).
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
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
    },
  );
}
