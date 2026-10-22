"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { formatCop } from "@/domain/money";
import { cn } from "@/ui/cn";

export interface PresentationDraft {
  packageLabel: string;
  pieces: string;
  pieceLabel: string;
}

interface PresentationFieldsProps {
  ingredientName: string;
  draft: PresentationDraft;
  /** Precio de cada porción con lo que hay escrito; null si falta algo. */
  pricePerPiece: number | null;
  onChange: (draft: PresentationDraft) => void;
  onCommit: () => void;
}

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase("es") + text.slice(1);

const FIELD =
  "h-8 rounded-md border border-hairline-strong bg-surface px-2 text-sm transition-colors duration-(--dur-fast) ease-out placeholder:text-muted hover:border-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none";

/**
 * Cómo viene lo que se compra: el nombre del empaque y, si se cuenta por porciones, cuántas
 * trae ("18 tajadas"). Va plegado para que la tabla siga siendo rápida de recorrer.
 */
export function PresentationFields({
  ingredientName,
  draft,
  pricePerPiece,
  onChange,
  onCommit,
}: PresentationFieldsProps) {
  const [open, setOpen] = useState(draft.pieces !== "");
  const panelId = useId();
  const commitOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) =>
    event.key === "Enter" && event.currentTarget.blur();
  const summary =
    draft.pieces && draft.pieceLabel
      ? `${capitalize(draft.packageLabel.trim() || "paquete")} de ${draft.pieces} ${draft.pieceLabel}${
          pricePerPiece !== null ? ` · ${formatCop(pricePerPiece)} c/u` : ""
        }`
      : "Empaque y porciones";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-fit items-center gap-1 text-xs text-muted transition-colors duration-(--dur-fast) hover:text-ink"
      >
        <ChevronDown
          className={cn("size-3.5 transition-transform duration-(--dur-base) ease-out", open && "rotate-180")}
          aria-hidden
        />
        {summary}
      </button>
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-(--dur-base) ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="flex flex-wrap items-end gap-3 overflow-hidden" inert={!open}>
          <label className="flex flex-col gap-1 text-xs text-muted">
            <span>
              Se llama<span className="sr-only"> el empaque de {ingredientName}</span>
            </span>
            <input
              value={draft.packageLabel}
              maxLength={30}
              placeholder="paquete"
              onChange={(event) => onChange({ ...draft, packageLabel: event.target.value })}
              onBlur={onCommit}
              onKeyDown={commitOnEnter}
              className={cn(FIELD, "w-28")}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            <span>
              Trae<span className="sr-only"> en porciones {ingredientName}</span>
            </span>
            <input
              inputMode="numeric"
              value={draft.pieces}
              placeholder="18"
              onChange={(event) => onChange({ ...draft, pieces: event.target.value.replace(/\D/g, "") })}
              onBlur={onCommit}
              onKeyDown={commitOnEnter}
              className={cn(FIELD, "w-16 text-right tabular-nums")}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            <span className="sr-only">Nombre de cada porción de {ingredientName}</span>
            <input
              value={draft.pieceLabel}
              maxLength={20}
              placeholder="tajadas"
              onChange={(event) => onChange({ ...draft, pieceLabel: event.target.value })}
              onBlur={onCommit}
              onKeyDown={commitOnEnter}
              className={cn(FIELD, "w-28")}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
