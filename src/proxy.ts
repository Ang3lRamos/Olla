import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/features/admin/emails";
import { CONFIRMATION_PATH } from "@/features/auth/confirmation";
import { ACTIONS_PER_USER, withinRateLimit } from "@/lib/rate-limit";
import { HOME_PATH } from "@/lib/routes";
import { refreshSession } from "@/lib/supabase/proxy-session";

const AUTH_PAGES = ["/ingresar", "/registro", "/recuperar"];
// Los textos legales se leen antes de registrarse. Los avisos de pago llegan de Wompi, sin
// sesión; la ruta verifica su firma.
const LEGAL_PAGES = ["/terminos", "/privacidad", "/reembolsos"];
const PUBLIC_PAGES = ["/", ...AUTH_PAGES, ...LEGAL_PAGES, CONFIRMATION_PATH, "/api/wompi/eventos"];

function redirectKeepingCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (pathname === "/ingresar" && request.nextUrl.pathname !== "/") {
    // Con la consulta: una invitación (/unirme?codigo=…) tiene que sobrevivir al ingreso.
    url.searchParams.set("siguiente", request.nextUrl.pathname + request.nextUrl.search);
  }
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

/** Revisión optimista de sesión; la autorización real la hacen la capa de datos y la RLS. */
export async function proxy(request: NextRequest) {
  const { response, isSignedIn, userId, email } = await refreshSession(request);
  const { pathname } = request.nextUrl;

  // Toda acción del servidor llega como POST: un tope por persona frena scripts y abusos.
  if (userId && request.method === "POST" && !(await withinRateLimit(`user:${userId}`, ACTIONS_PER_USER))) {
    return new NextResponse("Demasiadas acciones seguidas. Espera un minuto.", {
      status: 429,
      headers: { "Retry-After": String(ACTIONS_PER_USER.windowSeconds) },
    });
  }
  if (!isSignedIn && !PUBLIC_PAGES.includes(pathname)) {
    return redirectKeepingCookies(request, response, "/ingresar");
  }
  // El panel responde 404 de verdad: dentro de la página el notFound() llega tarde, con el
  // streaming ya en 200.
  if (isSignedIn && pathname.startsWith("/admin") && !isAdminEmail(email)) {
    return NextResponse.rewrite(new URL("/no-encontrado", request.url), { status: 404 });
  }
  // La página de inicio es para quien aún no tiene cuenta; con sesión se va directo a la semana.
  if (isSignedIn && (pathname === "/" || AUTH_PAGES.includes(pathname))) {
    return redirectKeepingCookies(request, response, HOME_PATH);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|brand/|pwa/|manifest.webmanifest|icon.png|apple-icon.png|favicon.ico).*)",
  ],
};
