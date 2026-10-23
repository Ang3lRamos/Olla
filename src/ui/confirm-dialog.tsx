"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./button";
import { cn } from "./cn";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Para salir sin hacer nada; "Cancelar" confunde cuando lo que se confirma es cancelar algo. */
  dismissLabel?: string;
  /** Las acciones que no destruyen nada (p. ej. pedir un reembolso) no van en rojo. */
  tone?: "danger" | "primary";
  confirmDisabled?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Diálogo modal sobre <dialog>: el navegador da el foco atrapado, Escape y el fondo inerte.
 * Entra con fundido y leve escala; la salida es más corta.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  dismissLabel = "Cancelar",
  tone = "danger",
  confirmDisabled,
  pending,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // Al navegar, Next deja la página anterior oculta pero montada: un <dialog> modal abierto
    // ahí seguiría bloqueando toda la pantalla aunque no se vea. Se cierra al ocultarse.
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-labelledby="confirm-dialog-title"
      className={cn(
        "m-auto w-[min(26rem,calc(100%-2rem))] rounded-md border border-hairline bg-surface p-6 text-ink shadow-raised",
        "scale-[0.96] opacity-0 transition-[opacity,transform,overlay,display] transition-discrete duration-(--dur-fast) ease-in",
        "open:scale-100 open:opacity-100 open:duration-(--dur-base) open:ease-out",
        "starting:open:scale-[0.96] starting:open:opacity-0",
        "backdrop:bg-transparent backdrop:transition-[background-color,overlay,display] backdrop:transition-discrete backdrop:duration-(--dur-base)",
        "open:backdrop:bg-scrim starting:open:backdrop:bg-transparent",
      )}
    >
      <h2 id="confirm-dialog-title" className="font-display text-xl font-semibold">
        {title}
      </h2>
      <div className="mt-2 text-[15px] text-muted">{description}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} autoFocus>
          {dismissLabel}
        </Button>
        <Button variant={tone} loading={pending} disabled={confirmDisabled} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
