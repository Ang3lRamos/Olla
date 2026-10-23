"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import { adminSendTestEmail } from "../actions";

/** Para saber si los avisos de reembolso llegan, sin tener que revisar los logs de Vercel. */
export function TestEmail() {
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string }>();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await adminSendTestEmail();
            setMessage(
              result.ok
                ? { tone: "success", text: `Enviado a ${result.to}. Revisa también la carpeta de spam.` }
                : { tone: "error", text: result.error },
            );
          })
        }
      >
        Enviar correo de prueba
      </Button>
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
    </div>
  );
}
