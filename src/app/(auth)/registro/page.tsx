import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthHeading } from "@/features/auth/components/auth-heading";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignUpPage() {
  return (
    <AuthForm
      mode="sign-up"
      heading={
        <AuthHeading
          title="Organiza la comida de la casa"
          description="Planea la semana, arma el mercado sin repetir y cuida la plata."
        />
      }
    />
  );
}
