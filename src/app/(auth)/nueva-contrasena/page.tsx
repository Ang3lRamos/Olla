import type { Metadata } from "next";
import { NewPasswordForm } from "@/features/auth/components/new-password-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

/** Se llega desde el enlace del correo, que ya abrió la sesión; sin sesión, el proxy lleva a ingresar. */
export default function NewPasswordPage() {
  return <NewPasswordForm />;
}
