import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "./cn";

interface TextFieldProps extends ComponentProps<"input"> {
  label: string;
  hint?: string;
  error?: string;
  /** Contenido dentro del campo, a la derecha (p. ej. mostrar contraseña). */
  trailing?: ReactNode;
}

export function TextField({ label, hint, error, trailing, className, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(hintId, errorId) || undefined}
          className={cn(
            "h-10 w-full rounded-md border border-hairline-strong bg-surface px-3 text-[15px] placeholder:text-muted",
            "transition-colors duration-(--dur-fast) ease-out hover:border-muted",
            "focus:border-accent focus:ring-3 focus:ring-accent/20 focus:outline-none",
            "aria-invalid:border-danger aria-invalid:focus:ring-danger/20",
            trailing ? "pr-11" : undefined,
          )}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="animate-rise text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
