import { cn } from "./cn";

/** Marcador de carga con la forma del contenido; el pulso es suave y se apaga con movimiento reducido. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-sunken", className)} />;
}
