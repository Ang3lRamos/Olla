import { Skeleton } from "@/ui/skeleton";

export function RecipeBrowserSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Cargando recetas">
      <div className="flex gap-1.5">
        {[64, 80, 56, 96, 60].map((width) => (
          <Skeleton key={width} className="h-8 rounded-full" style={{ width }} />
        ))}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index}>
            <Skeleton className="h-32" />
          </li>
        ))}
      </ul>
    </div>
  );
}
