import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "../env";
import type { Database } from "./database.types";
import { authForwarding, clientIpFrom } from "./forwarded-ip";

/**
 * Refresca la sesión de Supabase en cada petición y devuelve la respuesta con las
 * cookies actualizadas. Cualquier redirección debe copiar esas cookies.
 */
export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Renovar la sesión cuenta en el límite por IP de Supabase: va con la IP de la persona. Este
  // cliente solo toca la sesión, nunca datos, así que puede llevar la llave secreta.
  const forwarding = authForwarding(clientIpFrom(request.headers.get("x-forwarded-for")));
  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    forwarding?.apiKey ?? publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      global: forwarding ? { headers: forwarding.headers } : undefined,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub ?? null;
  return { response, isSignedIn: Boolean(userId), userId, email: data?.claims.email ?? null };
}
