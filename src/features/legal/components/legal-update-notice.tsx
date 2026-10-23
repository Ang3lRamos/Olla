"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/ui/button";
import { acceptLegalUpdate } from "../actions";

const LINK = "font-medium underline decoration-hairline-strong underline-offset-4 hover:decoration-ink";

/** Aviso en la app cuando cambian los términos o la privacidad, como lo prometen los términos. */
export function LegalUpdateNotice() {
  const [hidden, setHidden] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  if (hidden) return null;
  return (
    <div role="status" className="border-b border-maiz bg-maiz/10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center md:px-8">
        <p className="flex-1">
          Actualizamos los{" "}
          <Link href="/terminos" target="_blank" className={LINK}>
            términos
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" target="_blank" className={LINK}>
            política de privacidad
          </Link>
          : un menú gratis del asistente por semana, varias personas por hogar, reembolsos revisados por
          soporte y eliminar tu cuenta desde Ajustes.
          {failed && <span className="text-danger"> No pudimos guardarlo; vuelve a intentarlo.</span>}
        </p>
        <Button
          size="sm"
          className="self-start sm:self-auto"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await acceptLegalUpdate();
              if (result.ok) setHidden(true);
              else setFailed(true);
            })
          }
        >
          Entendido
        </Button>
      </div>
    </div>
  );
}
