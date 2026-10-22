import { Skeleton } from "@/ui/skeleton";

export function PantrySkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-8" role="status" aria-label="Cargando despensa">
      <Skeleton className="h-28" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10" />
        ))}
      </div>
    </div>
  );
}
