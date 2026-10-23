import { Skeleton } from "@/ui/skeleton";

export function WeekPlannerSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Cargando la semana">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-11 w-80 max-w-full" />
      </div>
      <Skeleton className="h-20" />
      <div className="hidden grid-cols-[5.5rem_repeat(7,minmax(0,1fr))] gap-1.5 lg:grid">
        {Array.from({ length: 32 }, (_, index) =>
          index % 8 === 0 ? <div key={index} /> : <Skeleton key={index} className="h-28" />,
        )}
      </div>
      <div className="flex flex-col gap-3 lg:hidden">
        <Skeleton className="h-14" />
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-24" />
        ))}
      </div>
    </div>
  );
}
