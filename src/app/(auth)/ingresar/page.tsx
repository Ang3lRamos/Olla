import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";
import { INVALID_LINK_ERROR } from "@/features/auth/confirmation";
import { safeRedirectPath } from "@/features/auth/schemas";

export const metadata: Metadata = { title: "Ingresar" };

const INVALID_LINK_MESSAGE =
  "El enlace de confirmación venció o ya se usó. Si ya confirmaste tu cuenta, ingresa; si no, regístrate de nuevo.";

async function SignInForm({ searchParams }: Pick<PageProps<"/ingresar">, "searchParams">) {
  const { siguiente, error } = await searchParams;
  const redirectTo = safeRedirectPath(typeof siguiente === "string" ? siguiente : null);
  return (
    <AuthForm
      mode="sign-in"
      redirectTo={redirectTo === "/" ? undefined : redirectTo}
      notice={error === INVALID_LINK_ERROR ? INVALID_LINK_MESSAGE : undefined}
    />
  );
}

export default function SignInPage({ searchParams }: PageProps<"/ingresar">) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-title font-semibold">Hola de nuevo</h1>
        <p className="text-muted">Ingresa para ver la semana, el mercado y las cuentas de la casa.</p>
      </div>
      <Suspense fallback={<AuthFormSkeleton />}>
        <SignInForm searchParams={searchParams} />
      </Suspense>
    </>
  );
}
