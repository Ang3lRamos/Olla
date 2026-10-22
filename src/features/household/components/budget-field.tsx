"use client";

import { useState } from "react";
import { TextField } from "@/ui/text-field";
import { parseBudget } from "../schemas";

const THOUSANDS = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

const formatBudget = (raw: string) => {
  const amount = parseBudget(raw);
  return amount === null ? "" : THOUSANDS.format(amount);
};

interface BudgetFieldProps {
  defaultValue: string;
  error?: string;
}

/** Muestra los puntos de miles mientras se escribe ("250.000"); el servidor vuelve a validar. */
export function BudgetField({ defaultValue, error }: BudgetFieldProps) {
  const [value, setValue] = useState(() => formatBudget(defaultValue));

  return (
    <TextField
      label="Presupuesto semanal para mercado (opcional)"
      name="weeklyBudgetCop"
      inputMode="numeric"
      autoComplete="off"
      placeholder="Ej.: 250.000"
      hint="En pesos. Sirve para avisarte si la semana se pasa."
      value={value}
      onChange={(event) => setValue(formatBudget(event.target.value))}
      error={error}
      trailing={<span className="pr-2 text-sm text-muted">COP</span>}
    />
  );
}
