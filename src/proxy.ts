import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/features/admin/emails";
import { CONFIRMATION_PATH } from "@/features/auth/confirmation";
import { HOME_PATH } from "@/lib/routes";
import { refreshSession } from "@/lib/supabase/proxy-session";

const AUTH_PAGES = ["/ingresar", "/registro", "/recuperar"];
// Los textos legales se leen antes de registrarse. Los avisos de pago llegan de Wompi, sin
// sesión; la ruta verifica su firma.
const LEGAL_PAGES = ["/terminos", "/privacidad", "/reembolsos"];
const PUBLIC_PAGES = [...AUTH_PAGES, ...LEGAL_PAGES, CONFIRMATION_PATH, "/api/wompi/eventos"];

function redirectKeepingCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (pathname === "/ingresar" && request.nextUrl.pathname !== "/") {
    url.searchParams.set("siguiente", request.nextUrl.pathname);
  }
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

/** Revisión optimista de sesión; la autorización real la hacen la capa de datos y la RLS. */
export async function proxy(request: NextRequest) {
  const { response, isSignedIn, email } = await refreshSession(request);
  const { pathname } = request.nextUrl;

  if (!isSignedIn && !PUBLIC_PAGES.includes(pathname)) {
    return redirectKeepingCookies(request, response, "/ingresar");
  }
  // El panel responde 404 de verdad: dentro de la página el notFound() llega tarde, con el
  // streaming ya en 200.
  if (isSignedIn && pathname.startsWith("/admin") && !isAdminEmail(email)) {
    return NextResponse.rewrite(new URL("/no-encontrado", request.url), { status: 404 });
  }
  if (isSignedIn && AUTH_PAGES.includes(pathname)) {
    return redirectKeepingCookies(request, response, HOME_PATH);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand/|icon.png|apple-icon.png|favicon.ico).*)"],
};
