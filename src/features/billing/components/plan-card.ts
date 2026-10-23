import { cn } from "@/ui/cn";

/**
 * La tarjeta de un plan, igual en la página de inicio y en Planes: con mouse crece un poco al
 * pasar y queda por encima de las otras; la de Pro lleva además la luz que recorre el contorno.
 */
export function planCardClasses(featured: boolean, className?: string) {
  return cn(
    "flex flex-col gap-5 rounded-md border bg-surface",
    "relative transition-[scale,border-color,box-shadow] duration-(--dur-base) ease-out",
    "[@media(hover:hover)]:hover:z-10 [@media(hover:hover)]:hover:scale-[1.04] [@media(hover:hover)]:hover:shadow-raised",
    featured
      ? "borde-luz border-ink shadow-raised"
      : "border-hairline [@media(hover:hover)]:hover:border-hairline-strong",
    className,
  );
}
