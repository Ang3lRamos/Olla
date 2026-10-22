"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";
import { cn } from "./cn";

interface SheetProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Panel modal sobre <dialog>: en celular sube desde abajo y en escritorio entra por la derecha,
 * así se entiende de dónde viene. La salida es más corta que la entrada.
 */
export function Sheet({ open, title, description, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-labelledby={titleId}
      className={cn(
        "m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-md border border-hairline bg-surface text-ink shadow-raised",
        "md:mt-0 md:ml-auto md:h-dvh md:max-h-none md:w-[28rem] md:rounded-none md:border-y-0 md:border-r-0",
        "translate-y-full md:translate-x-full md:translate-y-0",
        "transition-[transform,overlay,display] transition-discrete duration-(--dur-base) ease-in",
        "open:translate-y-0 open:duration-(--dur-slow) open:ease-out md:open:translate-x-0",
        "starting:open:translate-y-full md:starting:open:translate-x-full md:starting:open:translate-y-0",
        "backdrop:bg-transparent backdrop:transition-[background-color,overlay,display] backdrop:transition-discrete backdrop:duration-(--dur-base)",
        "open:backdrop:bg-scrim starting:open:backdrop:bg-transparent",
      )}
    >
      <div className="flex max-h-[88dvh] flex-col md:h-full md:max-h-none">
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <h2 id={titleId} className="font-display text-xl font-semibold">
              {title}
            </h2>
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          <Button variant="ghost" size="sm" className="-mr-2 px-2" aria-label="Cerrar" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
      </div>
    </dialog>
  );
}
