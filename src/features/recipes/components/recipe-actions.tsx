"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { buttonClasses, Button } from "@/ui/button";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { FormMessage } from "@/ui/form-message";
import { deleteRecipe, duplicateRecipe } from "../actions";

interface RecipeActionsProps {
  recipeId: string;
  recipeName: string;
  isOwn: boolean;
}

export function RecipeActions({ recipeId, recipeName, isOwn }: RecipeActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  // Las acciones redirigen al terminar bien; solo vuelven con un mensaje si algo falló.
  const run = (action: () => Promise<{ error: string }>) =>
    startTransition(async () => {
      const result = await action();
      if (result) setError(result.error);
      setConfirming(false);
    });

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2">
        {isOwn ? (
          <>
            <Link
              href={`/recetas/${recipeId}/editar`}
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              <Pencil className="size-4" aria-hidden />
              Editar
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
              <Trash2 className="size-4" aria-hidden />
              Eliminar
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            loading={pending}
            onClick={() => run(() => duplicateRecipe(recipeId))}
          >
            <Copy className="size-4" aria-hidden />
            Duplicar para editar
          </Button>
        )}
      </div>
      {!isOwn && (
        <p className="text-sm text-muted">Es del catálogo de Olla. Duplícala para ajustarla a tu casa.</p>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}

      <ConfirmDialog
        open={confirming}
        title="¿Eliminar esta receta?"
        description={
          <>
            <strong className="font-medium text-ink">{recipeName}</strong> se borrará de tus recetas. Esto no
            se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        pending={pending}
        onConfirm={() => run(() => deleteRecipe(recipeId))}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
