import { Skeleton } from "@/ui/skeleton";

export function RecipeDetailSkeleton() {
  return (
    <div className="flex flex-col gap-10" role="status" aria-label="Cargando receta">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-11 w-2/3" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-6" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      </div>
    </div>
  );
}
