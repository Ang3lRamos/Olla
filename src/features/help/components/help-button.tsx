"use client";

import { CircleHelp, Route } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/ui/button";
import { cn } from "@/ui/cn";
import { Sheet } from "@/ui/sheet";
import { helpFor } from "../help-content";
import { TourLink } from "./tour-link";

/** "?" de la barra superior: explica la pantalla en la que está la persona. */
export function HelpButton() {
  const [open, setOpen] = useState(false);
  const help = helpFor(usePathname());

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "grid size-8 place-items-center rounded-full text-muted",
          "transition-[background-color,color,transform] duration-(--dur-fast) ease-out hover:bg-sunken hover:text-ink active:scale-95",
        )}
      >
        <CircleHelp className="size-5" aria-hidden />
        <span className="sr-only">Ayuda</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={help.title} description="Ayuda">
        <div className="flex flex-col gap-5">
          <p>{help.intro}</p>
          <ul className="flex flex-col gap-3 text-sm text-muted">
            {help.tips.map((tip) => (
              <li key={tip} className="border-l-2 border-hairline-strong pl-3">
                {tip}
              </li>
            ))}
          </ul>
          <TourLink
            onStart={() => setOpen(false)}
            className={buttonClasses({ variant: "secondary", className: "w-fit" })}
          >
            <Route className="size-4" aria-hidden />
            Ver el recorrido de Olla
          </TourLink>
        </div>
      </Sheet>
    </>
  );
}

/** Mientras se conoce la ruta: el mismo botón, sin abrir nada todavía. */
export function HelpButtonFallback() {
  return (
    <span className="grid size-8 place-items-center text-muted" aria-hidden>
      <CircleHelp className="size-5" />
    </span>
  );
}
