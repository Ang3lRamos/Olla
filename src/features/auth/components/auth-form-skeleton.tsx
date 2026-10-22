import { Skeleton } from "@/ui/skeleton";

export function AuthFormSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Cargando formulario">
      {[0, 1].map((field) => (
        <div key={field} className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10" />
        </div>
      ))}
      <Skeleton className="mt-2 h-10" />
    </div>
  );
}
