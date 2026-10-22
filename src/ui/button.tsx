import type { ComponentProps } from "react";
import { cn } from "./cn";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-strong",
  secondary: "border border-hairline-strong bg-surface text-ink hover:bg-sunken",
  ghost: "text-ink hover:bg-sunken",
  danger: "border border-danger/40 text-danger hover:bg-danger hover:text-on-accent",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-[15px]",
};

interface ButtonStyle {
  variant?: Variant;
  size?: Size;
  className?: string;
}

/** Clases del botón, para dar el mismo aspecto a un enlace (<Link>). */
export function buttonClasses({ variant = "primary", size = "md", className }: ButtonStyle = {}) {
  return cn(
    "relative inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap",
    "transition-[background-color,transform] duration-(--dur-fast) ease-out active:scale-[0.98]",
    "disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

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
      className={buttonClasses({
        variant,
        size,
        className: cn(!loading && "disabled:opacity-50", className),
      })}
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
