import { cn } from "@/ui/cn";

/**
 * La tarjeta de un plan, igual en la página de inicio y en Planes: con mouse resalta al pasar
 * (sube un poco y gana borde y sombra); la de Pro lleva además el destello en el contorno.
 */
export function planCardClasses(featured: boolean, className?: string) {
  return cn(
    "flex flex-col gap-5 rounded-md border bg-surface",
    "transition-[translate,border-color,box-shadow] duration-(--dur-base) ease-out",
    "[@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-raised",
    featured
      ? "borde-luz border-ink shadow-raised"
      : "border-hairline [@media(hover:hover)]:hover:border-hairline-strong",
    className,
  );
}
