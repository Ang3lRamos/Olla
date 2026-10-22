"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import type { IngredientCategory } from "@/domain/categories";
import type { Ingredient } from "@/domain/types";
import { Button } from "@/ui/button";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { Select } from "@/ui/select";
import { deleteIngredient, updateIngredient } from "../actions";
import { categoryOptions } from "../select-options";

const FIELD =
  "h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-[15px] transition-colors duration-(--dur-fast) ease-out hover:border-hairline-strong focus:border-accent focus:bg-surface focus:ring-3 focus:ring-accent/15 focus:outline-none";

function ProductRow({ product, onDelete }: { product: Ingredient; onDelete: () => void }) {
  const [name, setName] = useState(product.name);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string }>();
  const [, startTransition] = useTransition();

  const save = (changes: { name?: string; category?: IngredientCategory }) =>
    startTransition(async () => {
      const result = await updateIngredient({
        id: product.id,
        name: changes.name ?? name,
        category: changes.category ?? product.category,
      });
      setMessage(result.ok ? { tone: "ok", text: "Guardado" } : { tone: "error", text: result.error });
      if (!result.ok) setName(product.name);
    });

  return (
    <li className="flex flex-col gap-1 py-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto]">
        <label>
          <span className="sr-only">Nombre de {product.name}</span>
          <input
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => name.trim() !== product.name && save({ name })}
            onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
            className={FIELD}
          />
        </label>
        <Select
          aria-label={`Categoría de ${product.name}`}
          value={product.category}
          options={categoryOptions}
          onValueChange={(category) => save({ category })}
          className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto"
        />
        <Button
          variant="ghost"
          size="sm"
          className="px-2 text-muted hover:text-danger"
          onClick={onDelete}
          aria-label={`Borrar ${product.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {message && (
        <p
          aria-live="polite"
          className={message.tone === "error" ? "px-2 text-xs text-danger" : "px-2 text-xs text-muted"}
        >
          {message.text}
        </p>
      )}
    </li>
  );
}

/** Los productos que creó el hogar: se renombran, se cambian de categoría o se borran. */
export function OwnProducts({ products }: { products: Ingredient[] }) {
  const [deleting, setDeleting] = useState<Ingredient | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  if (products.length === 0) return null;

  const confirmDelete = () =>
    startTransition(async () => {
      if (!deleting) return;
      const result = await deleteIngredient(deleting.id);
      setError(result.ok ? undefined : result.error);
      setDeleting(null);
    });

  return (
    <details className="group max-w-3xl rounded-md border border-hairline p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
        <span className="font-medium">Tus productos ({products.length})</span>
        <span className="text-sm text-muted group-open:hidden">Editar o borrar</span>
      </summary>
      <p className="mt-2 text-sm text-muted">
        Los que creaste para tu hogar. Borrar uno lo quita también de la despensa, los precios y el mercado.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <ul className="mt-2 divide-y divide-hairline">
        {products
          .toSorted((a, b) => a.name.localeCompare(b.name, "es"))
          .map((product) => (
            <ProductRow key={product.id} product={product} onDelete={() => setDeleting(product)} />
          ))}
      </ul>
      <ConfirmDialog
        open={deleting !== null}
        title={`¿Borrar «${deleting?.name ?? ""}»?`}
        description="Sale de la despensa, los precios y el mercado. No se puede deshacer."
        confirmLabel="Borrar"
        pending={pending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </details>
  );
}
