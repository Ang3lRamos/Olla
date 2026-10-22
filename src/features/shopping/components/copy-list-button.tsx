"use client";

import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/ui/button";

const FEEDBACK_MS = 2000;

/** Copia la lista como texto para pegarla en WhatsApp o en una nota del celular. */
export function CopyListButton({ getText }: { getText: () => string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(getText());
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), FEEDBACK_MS);
  };

  return (
    <Button variant="secondary" size="sm" onClick={copy} aria-live="polite">
      {state === "copied" ? (
        <Check className="size-4 text-cilantro" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {state === "copied" ? "Lista copiada" : state === "failed" ? "No se pudo copiar" : "Copiar lista"}
    </Button>
  );
}
