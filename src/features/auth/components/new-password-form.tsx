"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonClasses } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import { TextField } from "@/ui/text-field";
import { updatePassword, type NewPasswordState } from "../password-actions";
import { MIN_PASSWORD_LENGTH } from "../schemas";
import { AuthHeading } from "./auth-heading";
import { HOME_PATH } from "@/lib/routes";

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState<NewPasswordState, FormData>(updatePassword, {});

  if (state.done) {
    return (
      <div role="status" className="flex animate-rise flex-col gap-4">
        <CircleCheck className="size-8 text-cilantro" aria-hidden />
        <h1 className="font-display text-title font-semibold">Listo, ya cambiaste tu contraseña</h1>
        <p className="text-muted">La próxima vez ingresa con la nueva.</p>
        <Link href={HOME_PATH} className={buttonClasses({ className: "w-full" })}>
          Ir a mi semana
        </Link>
      </div>
    );
  }

  return (
    <>
      <AuthHeading title="Elige una nueva contraseña" description="Úsala desde ahora para ingresar a Olla." />
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
        <TextField
          label="Nueva contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
          error={state.fieldErrors?.password}
          required
        />
        <TextField
          label="Repítela"
          name="confirm"
          type="password"
          autoComplete="new-password"
          error={state.fieldErrors?.confirm}
          required
        />
        <Button type="submit" loading={pending} className="mt-2 w-full">
          Guardar contraseña
        </Button>
      </form>
    </>
  );
}
