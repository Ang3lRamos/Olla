"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/ui/button";

export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="flex max-w-md animate-rise flex-col gap-4 py-12">
      <h1 className="font-display text-title font-semibold">No pudimos cargar esta parte</h1>
      <p className="text-muted">
        Puede ser la conexión o el servidor. Tus datos están a salvo; intenta de nuevo en un momento.
      </p>
      <Button variant="secondary" className="w-fit" onClick={() => retry()}>
        <RotateCw className="size-4" aria-hidden />
        Reintentar
      </Button>
    </div>
  );
}
