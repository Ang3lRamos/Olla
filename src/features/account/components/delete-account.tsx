"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/button";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { deleteMyAccount } from "../actions";

/** Borrar la cuenta pide escribir el correo: es lo único en Olla que no se puede deshacer. */
export function DeleteAccount({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  const confirm = () =>
    startTransition(async () => {
      // Si sale bien, la acción redirige a ingresar; solo vuelve con un error.
      const result = await deleteMyAccount(typed);
      setError(result.error);
    });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="self-start px-0 text-muted hover:text-danger"
        onClick={() => setOpen(true)}
      >
        Eliminar mi cuenta
      </Button>
      <ConfirmDialog
        open={open}
        title="¿Eliminar tu cuenta?"
        description={
          <div className="flex flex-col gap-3">
            <p>
              Se borran tu cuenta y, si nadie más vive en tu hogar, sus recetas, semanas, despensa, precios y
              notas. Si tienes un plan, se pierde sin reembolso; si pagaste hace menos de 5 días hábiles, pide
              primero el reembolso en Planes. Solo conservamos los registros de pago que exige la ley.
            </p>
            <label className="flex flex-col gap-1.5 text-ink">
              <span className="text-sm">
                Escribe <span className="font-medium">{email}</span> para confirmar
              </span>
              <input
                type="email"
                autoComplete="off"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                className="h-10 rounded-md border border-hairline-strong bg-surface px-3 text-[15px] transition-colors duration-(--dur-fast) ease-out focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
          </div>
        }
        confirmLabel="Eliminar cuenta"
        dismissLabel="Volver"
        confirmDisabled={!matches}
        pending={pending}
        onConfirm={confirm}
        onClose={() => {
          setOpen(false);
          setTyped("");
          setError(undefined);
        }}
      />
    </>
  );
}
