import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { INVALID_LINK_ERROR } from "@/features/auth/confirmation";
import { safeRedirectPath } from "@/features/auth/schemas";

export const metadata: Metadata = { title: "Ingresar" };

const SIGN_IN_HEADING = (
  <AuthHeading
    title="Hola de nuevo"
    description="Ingresa para ver la semana, el mercado y las cuentas de la casa."
  />
);

const NOTICES = {
  [INVALID_LINK_ERROR]: {
    tone: "error",
    text: "El enlace de confirmación venció o ya se usó. Si ya confirmaste tu cuenta, ingresa; si no, regístrate de nuevo.",
  },
  "cuenta-borrada": { tone: "success", text: "Borramos tu cuenta y los datos de tu hogar." },
} as const;

async function SignInForm({ searchParams }: Pick<PageProps<"/ingresar">, "searchParams">) {
  const { siguiente, error, aviso } = await searchParams;
  const redirectTo = safeRedirectPath(typeof siguiente === "string" ? siguiente : null);
  return (
    <AuthForm
      mode="sign-in"
      heading={SIGN_IN_HEADING}
      redirectTo={redirectTo === "/" ? undefined : redirectTo}
      notice={error === INVALID_LINK_ERROR ? NOTICES[INVALID_LINK_ERROR] : aviso === "cuenta-borrada" ? NOTICES["cuenta-borrada"] : undefined}
    />
  );
}

export default function SignInPage({ searchParams }: PageProps<"/ingresar">) {
  return (
    <Suspense
      fallback={
        <>
          {SIGN_IN_HEADING}
          <AuthFormSkeleton />
        </>
      }
    >
      <SignInForm searchParams={searchParams} />
    </Suspense>
  );
}
