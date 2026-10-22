"use client";

import { MessageSquareText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { cn } from "@/ui/cn";
import type { AssistantMode } from "../schemas";
import { ADJUST_EXAMPLES } from "./assistant-messages";

const MODES: Array<{ value: AssistantMode; label: string; hint: string }> = [
  {
    value: "propose",
    label: "Proponer",
    hint: "Arma el menú con tus preferencias, el presupuesto y la despensa.",
  },
  { value: "adjust", label: "Ajustar", hint: "Dile qué cambiar con tus palabras." },
  {
    value: "review-notes",
    label: "Revisar notas",
    hint: "Lee tus notas y sugiere cambios, como aprovechar sobrantes.",
  },
];

export interface AssistantFormValues {
  mode: AssistantMode;
  instruction: string;
  onlyEmpty: boolean;
}

interface AssistantRequestFormProps {
  initial: AssistantFormValues;
  hasMeals: boolean;
  notesCount: number;
  onSubmit: (values: AssistantFormValues) => void;
}

export function AssistantRequestForm({ initial, hasMeals, notesCount, onSubmit }: AssistantRequestFormProps) {
  const [values, setValues] = useState(initial);
  const set = (patch: Partial<AssistantFormValues>) => setValues((current) => ({ ...current, ...patch }));
  const canSubmit =
    values.mode === "propose" ||
    (values.mode === "adjust" ? values.instruction.trim().length > 2 : notesCount > 0);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit(values);
      }}
    >
      <div
        role="radiogroup"
        aria-label="Qué quieres que haga"
        className="grid grid-cols-3 rounded-md border border-hairline bg-sunken p-0.5"
      >
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={values.mode === mode.value}
            onClick={() => set({ mode: mode.value })}
            className={cn(
              "h-8 rounded-sm px-2 text-sm transition-colors duration-(--dur-fast) ease-out",
              values.mode === mode.value
                ? "bg-surface font-medium text-ink shadow-raised"
                : "text-muted hover:text-ink",
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">{MODES.find((mode) => mode.value === values.mode)?.hint}</p>

      {values.mode === "propose" && (
        <Checkbox
          label="Solo llenar las casillas vacías"
          checked={values.onlyEmpty || !hasMeals}
          disabled={!hasMeals}
          onChange={(event) => set({ onlyEmpty: event.target.checked })}
        />
      )}

      {values.mode === "adjust" && (
        <div className="flex flex-col gap-2">
          <label htmlFor="assistant-instruction" className="text-sm font-medium">
            ¿Qué quieres cambiar?
          </label>
          <textarea
            id="assistant-instruction"
            rows={3}
            maxLength={400}
            value={values.instruction}
            onChange={(event) => set({ instruction: event.target.value })}
            placeholder="Ej.: cambia el pescado del viernes"
            className="rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] transition-colors duration-(--dur-fast) ease-out placeholder:text-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {ADJUST_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => set({ instruction: example })}
                className="rounded-full border border-hairline-strong px-2.5 py-1 text-xs text-muted transition-colors duration-(--dur-fast) ease-out hover:border-muted hover:text-ink"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {values.mode === "review-notes" && notesCount === 0 && (
        <p className="rounded-md bg-sunken px-3 py-2.5 text-sm text-muted">
          Esta semana no tiene notas. Anota cosas como «sobró arroz» en las comidas y vuelve aquí.
        </p>
      )}

      <Button type="submit" disabled={!canSubmit} className="w-fit">
        <MessageSquareText className="size-4" aria-hidden />
        {values.mode === "propose"
          ? "Proponer menú"
          : values.mode === "adjust"
            ? "Ajustar semana"
            : "Revisar notas"}
      </Button>
    </form>
  );
}
