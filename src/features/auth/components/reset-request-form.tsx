"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import { TextField } from "@/ui/text-field";
import { requestPasswordReset, type ResetRequestState } from "../password-actions";
import { AuthHeading } from "./auth-heading";

const BACK_LINK =
  "font-medium text-ink underline decoration-hairline-strong underline-offset-4 transition-colors duration-(--dur-fast) hover:decoration-ink";

function LinkSent({ email }: { email: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  // El foco pasa al título para que los lectores de pantalla anuncien el cambio.
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <div className="flex animate-rise flex-col gap-4">
      <MailCheck className="size-8 text-cilantro" aria-hidden />
      <h1 ref={headingRef} tabIndex={-1} className="font-display text-title font-semibold outline-none">
        Revisa tu correo
      </h1>
      <p className="text-muted">
        Si <span className="font-medium text-ink">{email}</span> tiene una cuenta en Olla, te llegó un enlace
        para elegir una nueva contraseña. Vence en una hora; revisa también la carpeta de spam.
      </p>
      <p className="border-t border-hairline pt-6 text-sm text-muted">
        ¿Ya la recordaste?{" "}
        <Link href="/ingresar" className={BACK_LINK}>
          Ingresa
        </Link>
      </p>
    </div>
  );
}

export function ResetRequestForm() {
  const [state, formAction, pending] = useActionState<ResetRequestState, FormData>(requestPasswordReset, {});
  if (state.sentTo) return <LinkSent email={state.sentTo} />;

  return (
    <>
      <AuthHeading
        title="¿Olvidaste tu contraseña?"
        description="Escribe el correo de tu cuenta y te enviamos un enlace para elegir una nueva."
      />
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
        <TextField
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.email}
          required
        />
        <Button type="submit" loading={pending} className="mt-2 w-full">
          Enviar enlace
        </Button>
        <p className="mt-4 border-t border-hairline pt-6 text-sm text-muted">
          <Link href="/ingresar" className={BACK_LINK}>
            Volver a ingresar
          </Link>
        </p>
      </form>
    </>
  );
}
