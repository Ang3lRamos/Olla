import { CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./cn";

interface FormMessageProps {
  tone: "error" | "success";
  children: ReactNode;
  className?: string;
}

/** Mensaje del formulario completo; se anuncia a lectores de pantalla al aparecer. */
export function FormMessage({ tone, children, className }: FormMessageProps) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex animate-rise items-start gap-2 rounded-md border px-3 py-2.5 text-sm",
        tone === "error" ? "border-danger/30 text-danger" : "border-cilantro/30 text-cilantro",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="text-ink">{children}</span>
    </p>
  );
}
