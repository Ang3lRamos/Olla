import { NextResponse, type NextRequest } from "next/server";
import { INVALID_LINK_ERROR, parseConfirmationRequest } from "@/features/auth/confirmation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Destino del enlace del correo de confirmación: abre la sesión y sigue al onboarding. */
export async function GET(request: NextRequest) {
  const confirmation = parseConfirmationRequest(request.nextUrl.searchParams);
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    return url;
  };

  if (confirmation) {
    const supabase = await createSupabaseServerClient();
    const { error } =
      confirmation.kind === "code"
        ? await supabase.auth.exchangeCodeForSession(confirmation.code)
        : await supabase.auth.verifyOtp({ token_hash: confirmation.tokenHash, type: confirmation.type });
    if (!error) return NextResponse.redirect(redirectTo("/empezar"));
  }

  const signIn = redirectTo("/ingresar");
  signIn.searchParams.set("error", INVALID_LINK_ERROR);
  return NextResponse.redirect(signIn);
}
