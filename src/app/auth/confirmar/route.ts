import { NextResponse, type NextRequest } from "next/server";
import {
  INVALID_LINK_ERROR,
  NEW_PASSWORD_PATH,
  parseConfirmationRequest,
} from "@/features/auth/confirmation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Destino de los enlaces del correo: abre la sesión y sigue al onboarding, o a elegir una nueva
 * contraseña si el enlace era para eso.
 */
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
    if (!error)
      return NextResponse.redirect(redirectTo(confirmation.recovery ? NEW_PASSWORD_PATH : "/empezar"));
  }

  const signIn = redirectTo("/ingresar");
  signIn.searchParams.set("error", INVALID_LINK_ERROR);
  return NextResponse.redirect(signIn);
}
