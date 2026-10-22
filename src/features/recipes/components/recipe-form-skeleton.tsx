import { Skeleton } from "@/ui/skeleton";

export function RecipeFormSkeleton() {
  return (
    <div className="flex max-w-4xl flex-col gap-8" role="status" aria-label="Cargando formulario">
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-9 w-96 max-w-full" />
      <Skeleton className="h-16 w-56" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-10" />
        ))}
      </div>
      <Skeleton className="h-40" />
    </div>
  );
}
