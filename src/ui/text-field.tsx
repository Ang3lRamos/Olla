import { useId, type ComponentProps } from "react";
import { cn } from "./cn";

interface TextFieldProps extends ComponentProps<"input"> {
  label: string;
  hint?: string;
}

export function TextField({ label, hint, className, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={hintId}
        className={cn(
          "h-10 rounded-md border border-hairline-strong bg-surface px-3 text-[15px] placeholder:text-muted",
          "transition-colors duration-(--dur-fast) ease-out hover:border-muted focus:border-achiote focus:outline-none",
        )}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
