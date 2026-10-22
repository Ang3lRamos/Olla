import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthFormSkeleton } from "@/features/auth/components/auth-form-skeleton";
import { safeRedirectPath } from "@/features/auth/schemas";

export const metadata: Metadata = { title: "Ingresar" };

async function SignInForm({ searchParams }: Pick<PageProps<"/ingresar">, "searchParams">) {
  const { siguiente } = await searchParams;
  const redirectTo = safeRedirectPath(typeof siguiente === "string" ? siguiente : null);
  return <AuthForm mode="sign-in" redirectTo={redirectTo === "/" ? undefined : redirectTo} />;
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
