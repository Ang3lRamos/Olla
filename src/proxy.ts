import { NextResponse, type NextRequest } from "next/server";
import { CONFIRMATION_PATH } from "@/features/auth/confirmation";
import { refreshSession } from "@/lib/supabase/proxy-session";

const AUTH_PAGES = ["/ingresar", "/registro"];
const PUBLIC_PAGES = [...AUTH_PAGES, CONFIRMATION_PATH];

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
  const { response, isSignedIn } = await refreshSession(request);
  const { pathname } = request.nextUrl;

  if (!isSignedIn && !PUBLIC_PAGES.includes(pathname)) {
    return redirectKeepingCookies(request, response, "/ingresar");
  }
  if (isSignedIn && AUTH_PAGES.includes(pathname)) {
    return redirectKeepingCookies(request, response, "/");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand/|icon.png|apple-icon.png|favicon.ico).*)"],
};
