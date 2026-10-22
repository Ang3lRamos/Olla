"use client";

import { useEffect, useRef, useState } from "react";
import type { PlannedSlot } from "@/domain/week-plan";
import { Button } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import { Spinner } from "@/ui/spinner";
import { askAssistant, type AskAssistantResult } from "../actions";
import type { ProposedChange } from "../sanitize";
import { hasAssistant, remainingRequests, type AiQuota } from "@/features/entitlements/quota";
import { withChanges } from "../with-changes";
import { AssistantError } from "./assistant-error";
import { AssistantRequestForm, type AssistantFormValues } from "./assistant-request-form";
import { ChangePreview } from "./change-preview";

/** Tras este tiempo se avisa que el modelo puede demorarse, para que nadie crea que se colgó. */
const SLOW_NOTICE_MS = 4000;

interface AssistantPanelProps {
  weekStart: string;
  slots: PlannedSlot[];
  notesCount: number;
  recipeName: (recipeId: string | null) => string;
  /** Mercado de la semana con esas casillas; lo calcula el dominio, no la IA. */
  marketFor: (slots: PlannedSlot[]) => number;
  onApply: (changes: ProposedChange[]) => void;
  quota: AiQuota;
}

type PanelState =
  { kind: "form" } | { kind: "loading"; slow: boolean } | { kind: "done"; result: AskAssistantResult };

export function AssistantPanel({
  weekStart,
  slots,
  notesCount,
  recipeName,
  marketFor,
  onApply,
  quota: initialQuota,
}: AssistantPanelProps) {
  const [state, setState] = useState<PanelState>({ kind: "form" });
  const [values, setValues] = useState<AssistantFormValues>({
    mode: "propose",
    instruction: "",
    onlyEmpty: true,
  });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [quota, setQuota] = useState(initialQuota);
  const requestId = useRef(0);

  // Si el panel se cierra mientras espera, la respuesta que llegue después se ignora.
  useEffect(() => () => void requestId.current++, []);

  const ask = async (request: AssistantFormValues) => {
    setValues(request);
    const id = ++requestId.current;
    setState({ kind: "loading", slow: false });
    const slowTimer = setTimeout(
      () => id === requestId.current && setState({ kind: "loading", slow: true }),
      SLOW_NOTICE_MS,
    );
    const result = await askAssistant({
      weekStart,
      ...request,
      // Solo el modo Ajustar usa la instrucción; no se arrastra a los otros modos.
      instruction: request.mode === "adjust" ? request.instruction : "",
    }).catch((): AskAssistantResult => ({
      ok: false,
      error: { kind: "unavailable", detail: "Fallo de red" },
      simulated: false,
      quota: null,
    }));
    clearTimeout(slowTimer);
    if (id !== requestId.current) return;
    if (result.quota) setQuota((current) => ({ ...current, ...result.quota }));
    if (result.ok) setSelected(new Set(result.changes.map((_, index) => index)));
    setState({ kind: "done", result });
  };

  if (state.kind === "form") {
    if (!hasAssistant(quota)) {
      return <AssistantError kind="not_entitled" />;
    }
    const remaining = remainingRequests(quota);
    return (
      <div className="flex flex-col gap-5">
        <p className="text-xs text-muted" aria-live="polite">
          {remaining === null ? (
            "Plan Pro · consultas sin límite."
          ) : (
            <>
              Plan Pro · te quedan <span className="font-medium text-ink tabular-nums">{remaining}</span> de{" "}
              {quota.dailyLimit} consultas hoy. Se renuevan a medianoche.
            </>
          )}
        </p>
        {remaining === 0 ? (
          <AssistantError kind="limit_reached" />
        ) : (
          <AssistantRequestForm
            initial={values}
            hasMeals={slots.length > 0}
            notesCount={notesCount}
            onSubmit={ask}
          />
        )}
      </div>
    );
  }

  if (state.kind === "loading") {
    return (
      <div role="status" className="flex animate-rise flex-col items-start gap-3 py-6">
        <Spinner className="size-6" />
        <p className="font-medium">Pensando el menú…</p>
        <p className={state.slow ? "text-sm text-muted" : "invisible text-sm"}>
          Está tardando un poco: los modelos gratuitos a veces se demoran. Sigue esperando o vuelve más tarde.
        </p>
      </div>
    );
  }

  const { result } = state;
  if (!result.ok) {
    return (
      <AssistantError
        kind={result.error.kind}
        onRetry={() => ask(values)}
        onBack={() => setState({ kind: "form" })}
      />
    );
  }

  const chosen = result.changes.filter((_, index) => selected.has(index));
  return (
    <div className="flex animate-rise flex-col gap-5">
      <div className="flex flex-col gap-2">
        {result.simulated && (
          <span className="w-fit rounded-full border border-hairline-strong px-2 py-0.5 text-xs text-muted">
            Modo simulado · sin IA real
          </span>
        )}
        <p className="text-[15px]">{result.summary}</p>
        {result.discarded.length > 0 && (
          <p className="text-xs text-muted">
            Descartamos {result.discarded.length} sugerencia(s) que no cumplían tus preferencias o no existen
            en tus recetas.
          </p>
        )}
      </div>

      {result.changes.length === 0 ? (
        <FormMessage tone="success">No hay cambios que aplicar.</FormMessage>
      ) : (
        <ChangePreview
          changes={result.changes}
          selected={selected}
          onToggle={(index) =>
            setSelected((current) => {
              const next = new Set(current);
              if (next.has(index)) next.delete(index);
              else next.add(index);
              return next;
            })
          }
          recipeName={recipeName}
          currentRecipeId={(day, meal) =>
            slots.find((slot) => slot.day === day && slot.meal === meal)?.recipeId ?? null
          }
          marketNowCop={marketFor(slots)}
          marketAfterCop={marketFor(withChanges(slots, chosen))}
        />
      )}

      {/* Fijo abajo: con muchas sugerencias, aplicar no debe exigir bajar hasta el final. */}
      <div className="sticky -bottom-5 -mx-5 -mb-5 flex flex-wrap gap-2 border-t border-hairline bg-surface px-5 py-3">
        {chosen.length > 0 && (
          <Button onClick={() => onApply(chosen)}>
            Aplicar {chosen.length} {chosen.length === 1 ? "cambio" : "cambios"}
          </Button>
        )}
        <Button variant="ghost" onClick={() => setState({ kind: "form" })}>
          {result.changes.length ? "Descartar" : "Volver"}
        </Button>
      </div>
    </div>
  );
}
