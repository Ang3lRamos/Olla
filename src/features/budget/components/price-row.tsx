"use client";

import { Check, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import type { Ingredient, Quantity } from "@/domain/types";
import { compatibleUnits, UNIT_LABELS, type Unit } from "@/domain/units";
import { formatDecimalInput, parseDecimal } from "@/lib/decimal-input";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { Select } from "@/ui/select";
import { resetIngredientPrice, saveIngredientPrice } from "../actions";
import { parsePriceCop } from "../schemas";

export interface PriceValue {
  priceCop: number;
  per: Quantity;
}

interface PriceRowProps {
  ingredient: Ingredient;
  price: PriceValue | null;
  isOwn: boolean;
}

type Status = { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string };

const THOUSANDS = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const formatPriceInput = (raw: string) => {
  const value = parsePriceCop(raw);
  return Number.isNaN(value) ? "" : THOUSANDS.format(value);
};

const FIELD =
  "h-9 w-full rounded-md border border-hairline-strong bg-surface px-2 text-right tabular-nums transition-colors duration-(--dur-fast) ease-out hover:border-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none";

/** Edita el precio de un ingrediente; guarda al salir del campo y confirma en la misma fila. */
export function PriceRow({ ingredient, price, isOwn }: PriceRowProps) {
  const units = compatibleUnits(ingredient);
  const [priceCop, setPriceCop] = useState(price ? THOUSANDS.format(price.priceCop) : "");
  const [perAmount, setPerAmount] = useState(formatDecimalInput(price?.per.amount ?? 1));
  const [perUnit, setPerUnit] = useState<Unit>(price?.per.unit ?? units[0] ?? "unit");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Cuando el servidor trae otro precio (p. ej. al restablecer), los campos se sincronizan sin
  // volver a montar la fila, así no se pierde la confirmación de "Guardado".
  const priceKey = price ? `${price.priceCop}|${price.per.amount}|${price.per.unit}` : "";
  const [syncedKey, setSyncedKey] = useState(priceKey);
  if (priceKey !== syncedKey) {
    setSyncedKey(priceKey);
    if (price) {
      setPriceCop(THOUSANDS.format(price.priceCop));
      setPerAmount(formatDecimalInput(price.per.amount));
      setPerUnit(price.per.unit);
    }
  }
  const [, startTransition] = useTransition();

  const unchanged =
    price !== null &&
    parsePriceCop(priceCop) === price.priceCop &&
    parseDecimal(perAmount) === price.per.amount &&
    perUnit === price.per.unit;

  const save = (unit = perUnit) => {
    if (priceCop.trim() === "" || (unchanged && unit === perUnit)) return;
    setStatus({ kind: "saving" });
    startTransition(async () => {
      const result = await saveIngredientPrice({
        ingredientId: ingredient.id,
        priceCop,
        perAmount,
        perUnit: unit,
      });
      setStatus(result.ok ? { kind: "saved" } : { kind: "error", message: result.error });
    });
  };

  const reset = () =>
    startTransition(async () => {
      const result = await resetIngredientPrice(ingredient.id);
      if (!result.ok) setStatus({ kind: "error", message: result.error });
    });

  return (
    <li className="flex flex-col gap-1 py-2.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_7rem_4.5rem_8.5rem_6.5rem]">
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{ingredient.name}</span>
          <span className={cn("text-xs", isOwn ? "text-ink" : "text-muted")}>
            {isOwn ? "Tu precio" : price ? "Precio de referencia" : "Sin precio"}
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
              value={priceCop}
              placeholder="0"
              onChange={(event) => setPriceCop(formatPriceInput(event.target.value))}
              onBlur={() => save()}
              onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
              className={cn(FIELD, "pl-5")}
            />
          </label>
          <label>
            <span className="sr-only">Cantidad a la que corresponde el precio</span>
            <input
              inputMode="decimal"
              value={perAmount}
              onChange={(event) => setPerAmount(event.target.value)}
              onBlur={() => save()}
              onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
              className={FIELD}
            />
          </label>
          <Select
            aria-label={`Unidad del precio de ${ingredient.name}`}
            value={perUnit}
            onChange={(event) => {
              const unit = event.target.value as Unit;
              setPerUnit(unit);
              save(unit);
            }}
          >
            {units.map((unit) => (
              <option key={unit} value={unit}>
                por {UNIT_LABELS[unit].singular}
              </option>
            ))}
          </Select>
        </div>
      </div>
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
