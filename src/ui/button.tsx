import type { ComponentProps } from "react";
import { cn } from "./cn";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-achiote text-on-achiote hover:bg-achiote-strong",
  secondary: "border border-hairline-strong bg-surface text-ink hover:bg-sunken",
  ghost: "text-ink hover:bg-sunken",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-[15px]",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  /** Muestra un indicador sin cambiar el ancho del botón y bloquea nuevos clics. */
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap",
        "transition-[background-color,transform] duration-(--dur-fast) ease-out active:scale-[0.98]",
        "disabled:pointer-events-none",
        !loading && "disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 transition-opacity duration-(--dur-fast) ease-out",
          loading && "opacity-0",
        )}
      >
        {children}
      </span>
      {loading && <Spinner className="absolute inset-0 m-auto" />}
    </button>
  );
}
