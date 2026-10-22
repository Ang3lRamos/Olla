import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignUpPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-title font-semibold">Organiza la comida de la casa</h1>
        <p className="text-muted">Planea la semana, arma el mercado sin repetir y cuida la plata.</p>
      </div>
      <AuthForm mode="sign-up" />
    </>
  );
}
