"use client";

import { LogOut, PiggyBank, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { signOut } from "@/features/auth/actions";
import { Button, buttonClasses } from "@/ui/button";
import { cn } from "@/ui/cn";
import { ThemeToggle } from "@/ui/theme/theme-toggle";

export function UserMenuPopover({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Menú de la cuenta"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "grid size-8 place-items-center rounded-full bg-sunken text-sm font-semibold uppercase",
          "transition-[background-color,transform] duration-(--dur-fast) ease-out hover:bg-hairline active:scale-95",
        )}
      >
        {email.charAt(0)}
      </button>

      {/* Siempre montado para poder animar también la salida (más corta que la entrada). */}
      <div
        id={panelId}
        inert={!open}
        className={cn(
          "absolute top-full right-0 mt-2 w-64 origin-top-right rounded-md border border-hairline bg-surface p-3 shadow-raised",
          "transition-[opacity,transform]",
          open
            ? "scale-100 opacity-100 duration-(--dur-base) ease-out"
            : "pointer-events-none scale-[0.96] opacity-0 duration-(--dur-fast) ease-in",
        )}
      >
        <p className="truncate text-sm font-medium">{email}</p>
        <div className="my-3 border-t border-hairline" />
        <p className="mb-2 text-xs text-muted">Tema</p>
        <ThemeToggle className="w-full" />
        <div className="my-3 border-t border-hairline" />
        <Link
          href="/presupuesto"
          onClick={() => setOpen(false)}
          className={buttonClasses({ variant: "ghost", size: "sm", className: "w-full justify-start px-2" })}
        >
          <PiggyBank className="size-4" aria-hidden />
          Presupuesto y precios
        </Link>
        <Link
          href="/ajustes"
          onClick={() => setOpen(false)}
          className={buttonClasses({ variant: "ghost", size: "sm", className: "w-full justify-start px-2" })}
        >
          <Settings className="size-4" aria-hidden />
          Ajustes del hogar
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start px-2">
            <LogOut className="size-4" aria-hidden />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
