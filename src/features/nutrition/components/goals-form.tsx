"use client";

import { useState, useTransition } from "react";
import {
  DEFAULT_DIRECTIONS,
  NUTRIENT_KEYS,
  NUTRIENT_LABELS,
  type GoalDirection,
  type NutrientKey,
  type NutritionGoal,
} from "@/domain/nutrition-goals";
import { formatDecimalInput } from "@/lib/decimal-input";
import { Button } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import { Select } from "@/ui/select";
import { saveGoals } from "../actions";

const DIRECTION_OPTIONS: Array<{ value: GoalDirection; label: string }> = [
  { value: "min", label: "Al menos" },
  { value: "max", label: "Máximo" },
];

type Draft = Record<NutrientKey, { target: string; direction: GoalDirection }>;

const toDraft = (goals: NutritionGoal[]): Draft =>
  Object.fromEntries(
    NUTRIENT_KEYS.map((nutrient) => {
      const goal = goals.find((item) => item.nutrient === nutrient);
      return [
        nutrient,
        {
          target: goal ? formatDecimalInput(goal.target) : "",
          direction: goal?.direction ?? DEFAULT_DIRECTIONS[nutrient],
        },
      ];
    }),
  ) as Draft;

const FIELD =
  "h-10 w-full rounded-md border border-hairline-strong bg-surface px-3 text-right text-[15px] tabular-nums transition-colors duration-(--dur-fast) ease-out placeholder:text-muted hover:border-muted focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none";

/** Metas diarias de la persona. Todas opcionales; Olla solo compara contra ellas. */
export function GoalsForm({ goals }: { goals: NutritionGoal[] }) {
  const [draft, setDraft] = useState(() => toDraft(goals));
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string }>();
  const [pending, startTransition] = useTransition();
  const set = (nutrient: NutrientKey, change: Partial<Draft[NutrientKey]>) =>
    setDraft((current) => ({ ...current, [nutrient]: { ...current[nutrient], ...change } }));

  const save = () =>
    startTransition(async () => {
      const result = await saveGoals(NUTRIENT_KEYS.map((nutrient) => ({ nutrient, ...draft[nutrient] })));
      setMessage(
        result.ok ? { tone: "success", text: "Metas guardadas." } : { tone: "error", text: result.error },
      );
    });

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {NUTRIENT_KEYS.map((nutrient) => {
          const { name, unit } = NUTRIENT_LABELS[nutrient];
          return (
            <li key={nutrient} className="grid grid-cols-[minmax(0,1fr)_8rem_7rem] items-center gap-2 py-2.5">
              <span className="font-medium">{name}</span>
              <Select
                aria-label={`Tipo de meta de ${name.toLowerCase()}`}
                value={draft[nutrient].direction}
                options={DIRECTION_OPTIONS}
                onValueChange={(direction) => set(nutrient, { direction })}
              />
              <label className="relative">
                <span className="sr-only">
                  Meta de {name.toLowerCase()} al día, en {unit}
                </span>
                <input
                  inputMode="decimal"
                  placeholder="—"
                  value={draft[nutrient].target}
                  onChange={(event) => set(nutrient, { target: event.target.value })}
                  className={`${FIELD} pr-12`}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted">
                  {unit}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted">
        Al día y por persona. Deja vacío lo que no quieras seguir. Las pones tú: Olla no recomienda cantidades
        y los valores son aproximados. Si tienes una condición de salud, consúltalo con un profesional.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} loading={pending}>
          Guardar metas
        </Button>
        {message && (
          <FormMessage tone={message.tone} className="border-transparent px-0 py-0">
            {message.text}
          </FormMessage>
        )}
      </div>
    </div>
  );
}
