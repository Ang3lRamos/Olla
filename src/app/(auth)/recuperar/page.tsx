import type { Metadata } from "next";
import { ResetRequestForm } from "@/features/auth/components/reset-request-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ResetPasswordPage() {
  return <ResetRequestForm />;
}
