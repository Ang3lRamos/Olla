"use client";

import { Check, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import type { Ingredient, PackagePieces, Quantity } from "@/domain/types";
import { compatibleUnits, type Unit } from "@/domain/units";
import { unitOptions } from "@/features/catalog/select-options";
import { formatDecimalInput, parseDecimal } from "@/lib/decimal-input";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { Select } from "@/ui/select";
import { resetIngredientPrice, saveIngredientPrice } from "../actions";
import { parsePriceCop } from "../schemas";
import { PresentationFields, type PresentationDraft } from "./presentation-fields";

export interface PriceValue {
  priceCop: number;
  per: Quantity;
  packageLabel: string | null;
  pieces: PackagePieces | null;
}

interface PriceRowProps {
  ingredient: Ingredient;
  price: PriceValue | null;
  isOwn: boolean;
}

type Status = { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string };

interface Draft extends PresentationDraft {
  priceCop: string;
  perAmount: string;
  perUnit: Unit;
}

const THOUSANDS = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const formatPriceInput = (raw: string) => {
  const value = parsePriceCop(raw);
  return Number.isNaN(value) ? "" : THOUSANDS.format(value);
};

const toDraft = (price: PriceValue | null, defaultUnit: Unit): Draft => ({
  priceCop: price ? THOUSANDS.format(price.priceCop) : "",
  perAmount: formatDecimalInput(price?.per.amount ?? 1),
  perUnit: price?.per.unit ?? defaultUnit,
  packageLabel: price?.packageLabel ?? "",
  pieces: price?.pieces ? String(price.pieces.count) : "",
  pieceLabel: price?.pieces?.label ?? "",
});

const sameDraft = (a: Draft, b: Draft) =>
  parsePriceCop(a.priceCop) === parsePriceCop(b.priceCop) &&
  parseDecimal(a.perAmount) === parseDecimal(b.perAmount) &&
  a.perUnit === b.perUnit &&
  a.packageLabel.trim() === b.packageLabel.trim() &&
  a.pieces === b.pieces &&
  a.pieceLabel.trim() === b.pieceLabel.trim();

const FIELD =
  "h-9 w-full rounded-md border border-hairline-strong bg-surface px-2 text-right tabular-nums transition-colors duration-(--dur-fast) ease-out hover:border-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none";

const commitOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) =>
  event.key === "Enter" && event.currentTarget.blur();

/**
 * Edita lo que compra el hogar de un ingrediente: cuánto paga, por cuánto contenido y, si
 * quiere, en qué empaque y cuántas porciones trae. Guarda al salir de cada campo.
 */
export function PriceRow({ ingredient, price, isOwn }: PriceRowProps) {
  const units = compatibleUnits(ingredient);
  const saved = toDraft(price, units[0] ?? "unit");
  const [draft, setDraft] = useState(saved);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [, startTransition] = useTransition();

  // Cuando el servidor trae otro precio (p. ej. al restablecer), los campos se sincronizan sin
  // volver a montar la fila, así no se pierde la confirmación de "Guardado". Si la persona está
  // escribiendo, gana lo que escribe: la respuesta de un guardado anterior no la pisa.
  const [synced, setSynced] = useState(saved);
  if (!sameDraft(saved, synced)) {
    setSynced(saved);
    if (sameDraft(draft, synced)) setDraft(saved);
  }

  const save = (next: Draft = draft) => {
    if (next.priceCop.trim() === "" || (price !== null && sameDraft(next, saved))) return;
    setStatus({ kind: "saving" });
    startTransition(async () => {
      const result = await saveIngredientPrice({ ingredientId: ingredient.id, ...next });
      setStatus(result.ok ? { kind: "saved" } : { kind: "error", message: result.error });
    });
  };

  const reset = () =>
    startTransition(async () => {
      const result = await resetIngredientPrice(ingredient.id);
      if (!result.ok) setStatus({ kind: "error", message: result.error });
    });

  const pieces = Number(draft.pieces);
  const priceCop = parsePriceCop(draft.priceCop);
  const pricePerPiece = pieces > 0 && !Number.isNaN(priceCop) ? priceCop / pieces : null;

  return (
    <li className="flex flex-col gap-1.5 py-2.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_7rem_4.5rem_8.5rem_6.5rem]">
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{ingredient.name}</span>
          <span className={cn("text-xs", isOwn ? "text-ink" : "text-muted")}>
            {isOwn ? "Lo que compras" : price ? "Referencia · ponle tu precio" : "Sin precio"}
          </span>
        </span>
        <span className="justify-self-end sm:order-last">
          {isOwn ? (
            <Button variant="ghost" size="sm" className="px-2 text-muted" onClick={reset}>
              <RotateCcw className="size-3.5" aria-hidden />
              Restablecer
            </Button>
          ) : null}
        </span>
        <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_4.5rem_8.5rem] items-center gap-2 sm:contents">
          <label className="relative">
            <span className="sr-only">Precio de {ingredient.name} en pesos</span>
            <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-sm text-muted">
              $
            </span>
            <input
              inputMode="numeric"
              value={draft.priceCop}
              placeholder="0"
              onChange={(event) => setDraft({ ...draft, priceCop: formatPriceInput(event.target.value) })}
              onBlur={() => save()}
              onKeyDown={commitOnEnter}
              className={cn(FIELD, "pl-5")}
            />
          </label>
          <label>
            <span className="sr-only">Contenido de lo que compras de {ingredient.name}</span>
            <input
              inputMode="decimal"
              value={draft.perAmount}
              onChange={(event) => setDraft({ ...draft, perAmount: event.target.value })}
              onBlur={() => save()}
              onKeyDown={commitOnEnter}
              className={FIELD}
            />
          </label>
          <Select
            aria-label={`Unidad del contenido de ${ingredient.name}`}
            value={draft.perUnit}
            options={unitOptions(units)}
            onValueChange={(perUnit) => {
              const next = { ...draft, perUnit };
              setDraft(next);
              save(next);
            }}
          />
        </div>
      </div>
      <PresentationFields
        ingredientName={ingredient.name}
        draft={draft}
        pricePerPiece={pricePerPiece}
        onChange={(presentation) => setDraft({ ...draft, ...presentation })}
        onCommit={() => save()}
      />
      <p
        aria-live="polite"
        className={cn(
          "flex h-4 items-center gap-1 text-xs transition-opacity duration-(--dur-base) ease-out",
          status.kind === "idle" ? "opacity-0" : "opacity-100",
          status.kind === "error" ? "text-danger" : "text-muted",
        )}
      >
        {status.kind === "saving" && "Guardando…"}
        {status.kind === "saved" && (
          <>
            <Check className="size-3 text-cilantro" aria-hidden /> Guardado · ya cuenta en la semana y el
            mercado
          </>
        )}
        {status.kind === "error" && status.message}
      </p>
    </li>
  );
}
