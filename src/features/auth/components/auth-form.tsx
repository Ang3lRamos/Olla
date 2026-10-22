"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { Button } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import { TextField } from "@/ui/text-field";
import { signIn, signUp, type AuthFormState } from "../actions";
import { MIN_PASSWORD_LENGTH } from "../schemas";
import { CheckEmail } from "./check-email";

const MODES = {
  "sign-in": {
    action: signIn,
    submit: "Ingresar",
    pending: "Ingresando…",
    autoComplete: "current-password",
    switchText: "¿Aún no tienes cuenta?",
    switchLink: { href: "/registro", label: "Crea una" },
    note: null,
  },
  "sign-up": {
    action: signUp,
    submit: "Crear cuenta",
    pending: "Creando cuenta…",
    autoComplete: "new-password",
    switchText: "¿Ya tienes cuenta?",
    switchLink: { href: "/ingresar", label: "Ingresa" },
    note: "Gratis y sin tarjeta: recetas, semana, mercado y presupuesto. El asistente es parte del plan Pro.",
  },
} as const;

interface AuthFormProps {
  mode: keyof typeof MODES;
  /** Título de la pantalla; se reemplaza por "Revisa tu correo" tras registrarse. */
  heading: ReactNode;
  redirectTo?: string;
  /** Aviso que llega desde la URL, p. ej. un enlace de confirmación vencido. */
  notice?: string;
}

/** Cada intento es una instancia nueva, así "Usar otro correo" vuelve al formulario limpio. */
export function AuthForm(props: AuthFormProps) {
  const [attempt, setAttempt] = useState(0);
  return <AuthFormAttempt key={attempt} {...props} onRestart={() => setAttempt((count) => count + 1)} />;
}

function AuthFormAttempt({
  mode,
  heading,
  redirectTo,
  notice,
  onRestart,
}: AuthFormProps & { onRestart: () => void }) {
  const config = MODES[mode];
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(config.action, {});
  const [showPassword, setShowPassword] = useState(false);

  if (state.needsConfirmation && state.email) {
    return <CheckEmail email={state.email} onUseAnotherEmail={onRestart} />;
  }

  return (
    <>
      {heading}
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {redirectTo && <input type="hidden" name="siguiente" value={redirectTo} />}
        {(state.error ?? notice) && <FormMessage tone="error">{state.error ?? notice}</FormMessage>}

        <TextField
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.email}
          error={state.fieldErrors?.email}
          required
        />
        <TextField
          label="Contraseña"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete={config.autoComplete}
          hint={mode === "sign-up" ? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.` : undefined}
          error={state.fieldErrors?.password}
          required
          trailing={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2 text-muted"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          }
        />

        <Button type="submit" loading={pending} className="mt-2 w-full">
          {config.submit}
        </Button>
        <span className="sr-only" aria-live="polite">
          {pending ? config.pending : ""}
        </span>
        {config.note && <p className="text-xs text-muted">{config.note}</p>}

        <p className="mt-4 border-t border-hairline pt-6 text-sm text-muted">
          {config.switchText}{" "}
          <Link
            href={config.switchLink.href}
            className="font-medium text-ink underline decoration-hairline-strong underline-offset-4 transition-colors duration-(--dur-fast) hover:decoration-ink"
          >
            {config.switchLink.label}
          </Link>
        </p>
      </form>
    </>
  );
}
