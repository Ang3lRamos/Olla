import { Skeleton } from "@/ui/skeleton";

export function HouseholdFormSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Cargando datos del hogar">
      {["w-32", "w-56", "w-64", "w-60"].map((labelWidth, index) => (
        <div key={labelWidth} className="flex flex-col gap-1.5">
          <Skeleton className={`h-4 ${labelWidth}`} />
          <Skeleton className={index === 1 ? "h-10 w-48" : "h-10"} />
        </div>
      ))}
      <Skeleton className="h-10 w-40" />
    </div>
  );
}
