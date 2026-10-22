import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

/** <select> nativo con el estilo de los campos: accesible y con el selector del sistema en celular. */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-hairline-strong bg-surface pr-9 pl-3 text-[15px]",
          "transition-colors duration-(--dur-fast) ease-out hover:border-muted",
          "focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none",
          "disabled:opacity-50 aria-invalid:border-danger",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
}
