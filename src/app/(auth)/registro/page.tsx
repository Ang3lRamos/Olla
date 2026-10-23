import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { safeRedirectPath } from "@/features/auth/schemas";

export const metadata: Metadata = { title: "Crear cuenta" };

const SIGN_UP_HEADING = (
  <AuthHeading
    title="Organiza la comida de la casa"
    description="Planea la semana, arma el mercado sin repetir y cuida la plata."
  />
);

async function SignUpForm({ searchParams }: Pick<PageProps<"/registro">, "searchParams">) {
  const { siguiente } = await searchParams;
  const redirectTo = safeRedirectPath(typeof siguiente === "string" ? siguiente : null);
  return (
    <AuthForm
      mode="sign-up"
      heading={SIGN_UP_HEADING}
      redirectTo={redirectTo === "/" ? undefined : redirectTo}
    />
  );
}

export default function SignUpPage({ searchParams }: PageProps<"/registro">) {
  return (
    <Suspense
      fallback={
        <>
          {SIGN_UP_HEADING}
          <AuthFormSkeleton />
        </>
      }
    >
      <SignUpForm searchParams={searchParams} />
    </Suspense>
  );
}
