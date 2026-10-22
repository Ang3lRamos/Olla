import type { CSSProperties } from "react";
import { cn } from "./cn";

/** Marcador de carga con la forma del contenido; el pulso es suave y se apaga con movimiento reducido. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden style={style} className={cn("animate-pulse rounded-md bg-sunken", className)} />;
}
