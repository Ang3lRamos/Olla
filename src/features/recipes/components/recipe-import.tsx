"use client";

import { ClipboardPaste } from "lucide-react";
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { importRecipeText } from "../import/actions";
import { MAX_IMPORT_TEXT, MIN_IMPORT_TEXT } from "../import/schema";
import type { ImportedRecipe } from "../import/to-draft";

interface RecipeImportProps {
  onImported: (recipe: ImportedRecipe) => void;
}

/**
 * "Pegar receta": el asistente lee el texto y llena el formulario. No guarda nada; la persona
 * revisa, completa lo que falte y guarda.
 */
export function RecipeImport({ onImported }: RecipeImportProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<{ message: string; needsPlan?: boolean }>();
  const [done, setDone] = useState<{ missing: number; simulated: boolean }>();
  const [pending, startTransition] = useTransition();
  const fieldId = useId();

  const read = () =>
    startTransition(async () => {
      setError(undefined);
      const result = await importRecipeText(text);
      if (!result.ok) {
        setError({ message: result.error, needsPlan: result.needsPlan });
        return;
      }
      onImported(result.recipe);
      setDone({
        missing: result.recipe.lines.filter((line) => !line.ingredientId).length,
        simulated: result.simulated,
      });
      setOpen(false);
    });

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-md border border-dashed border-hairline-strong p-4 text-left transition-colors duration-(--dur-fast) ease-out hover:border-ink"
        >
          <ClipboardPaste className="size-5 shrink-0 text-ink" aria-hidden />
          <span className="flex flex-col">
            <span className="font-medium">¿La tienes escrita? Pégala</span>
            <span className="text-sm text-muted">
              El asistente llena el formulario con los ingredientes, las cantidades y los pasos.
            </span>
          </span>
        </button>
        {done && (
          <p role="status" className="animate-rise text-sm text-muted">
            Listo: revisa los datos antes de guardar.
            {done.missing > 0 &&
              ` ${done.missing === 1 ? "Un ingrediente no está" : `${done.missing} ingredientes no están`} en tu lista: créalos o elige otro.`}
            {done.simulated && " (Modo simulado)"}
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="flex animate-rise flex-col gap-3 rounded-md border border-ink p-4">
      <label htmlFor={fieldId} className="font-medium">
        Pega la receta
      </label>
      <textarea
        id={fieldId}
        autoFocus
        rows={8}
        maxLength={MAX_IMPORT_TEXT}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={
          "Arroz con pollo\n\nIngredientes:\n2 tazas de arroz\n1 libra de pechuga…\n\nPreparación:\n1. Sofríe…"
        }
        className={cn(
          "rounded-md border border-hairline-strong bg-surface px-3 py-2.5 text-[15px] leading-relaxed placeholder:text-muted",
          "transition-colors duration-(--dur-fast) ease-out hover:border-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none",
        )}
      />
      <p className="text-xs text-muted">
        Usa una consulta del asistente. Las cantidades y los costos los calcula Olla con tus precios.
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error.message}{" "}
          {error.needsPlan && (
            <Link href="/planes" className="font-medium text-ink underline underline-offset-4">
              Ver planes
            </Link>
          )}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={read}
          loading={pending}
          disabled={text.trim().length < MIN_IMPORT_TEXT}
        >
          Llenar con el asistente
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </section>
  );
}
