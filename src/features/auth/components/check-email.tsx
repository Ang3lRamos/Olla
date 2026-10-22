"use client";

import { MailCheck } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import { resendConfirmation, type ResendState } from "../actions";

const RESEND_COOLDOWN_SECONDS = 60;

const STEPS = [
  "Abre el correo de Olla. Puede tardar un par de minutos en llegar.",
  "Toca «Confirmar mi cuenta».",
  "Te traemos de vuelta para configurar tu hogar.",
];

interface ResendButtonProps {
  email: string;
  pending: boolean;
  action: (formData: FormData) => void;
}

/** Se monta de nuevo tras cada envío (key), así la espera arranca otra vez sin efectos extra. */
function ResendButton({ email, pending, action }: ResendButtonProps) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((seconds) => Math.max(seconds - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <Button
        type="submit"
        variant="secondary"
        loading={pending}
        disabled={secondsLeft > 0}
        className="w-full"
      >
        {secondsLeft > 0 ? `Reenviar correo en ${secondsLeft} s` : "Reenviar correo"}
      </Button>
    </form>
  );
}

interface CheckEmailProps {
  email: string;
  onUseAnotherEmail: () => void;
}

export function CheckEmail({ email, onUseAnotherEmail }: CheckEmailProps) {
  const [state, resendAction, pending] = useActionState<ResendState, FormData>(resendConfirmation, {});
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Mueve el foco al título para que los lectores de pantalla anuncien el cambio de pantalla.
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <section className="flex animate-rise flex-col gap-6">
      <div className="grid size-12 place-items-center rounded-full bg-sunken">
        <MailCheck className="size-6" aria-hidden />
      </div>

      <div className="flex flex-col gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-title font-semibold outline-none">
          Revisa tu correo
        </h1>
        <p className="text-muted">
          Te enviamos un enlace de confirmación a <strong className="font-medium text-ink">{email}</strong>.
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-start gap-3 text-[15px]">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-hairline-strong text-xs font-semibold tabular-nums">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <p className="rounded-md bg-sunken px-3 py-2.5 text-sm text-muted">
        ¿No te llega? Revisa las carpetas de spam o promociones antes de pedirlo de nuevo.
      </p>

      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      {state.sentAt && !pending && <FormMessage tone="success">Te lo enviamos de nuevo.</FormMessage>}

      <div className="flex flex-col gap-3">
        <ResendButton key={state.sentAt ?? 0} email={email} pending={pending} action={resendAction} />
        <Button type="button" variant="ghost" onClick={onUseAnotherEmail} className="w-full text-muted">
          Usar otro correo
        </Button>
      </div>
    </section>
  );
}
