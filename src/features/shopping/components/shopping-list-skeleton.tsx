import { Skeleton } from "@/ui/skeleton";

export function ShoppingListSkeleton() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Cargando el mercado">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-11 w-48" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-9" />
          ))}
        </div>
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
