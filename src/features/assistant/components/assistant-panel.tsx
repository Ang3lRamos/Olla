"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { MENU_STYLE_LABELS, type MenuStyle } from "@/domain/menu-styles";
import type { PlannedSlot } from "@/domain/week-plan";
import { Button } from "@/ui/button";
import { FormMessage } from "@/ui/form-message";
import { Spinner } from "@/ui/spinner";
import { askAssistant, type AskAssistantResult } from "../actions";
import type { ProposedChange } from "../sanitize";
import {
  canPropose,
  canUseFreeMenu,
  hasAssistant,
  remainingRequests,
  type AiQuota,
} from "@/features/entitlements/quota";
import { PLAN_NAMES } from "@/features/billing/plans";
import { withChanges } from "../with-changes";
import { AssistantError } from "./assistant-error";
import { AssistantRequestForm, type AssistantFormValues } from "./assistant-request-form";
import { ChangePreview } from "./change-preview";
import { LeftoverPurchases } from "./leftover-purchases";

/** Tras este tiempo se avisa que el modelo puede demorarse, para que nadie crea que se colgó. */
const SLOW_NOTICE_MS = 4000;

interface AssistantPanelProps {
  weekStart: string;
  slots: PlannedSlot[];
  notesCount: number;
  recipeName: (recipeId: string | null) => string;
  /** Mercado de la semana con esas casillas; lo calcula el dominio, no la IA. */
  marketFor: (slots: PlannedSlot[]) => number;
  /** `addLeftover`: agregar al mercado lo que se iba a mercar y ninguna receta usa. */
  onApply: (changes: ProposedChange[], addLeftover: boolean) => void;
  quota: AiQuota;
  /** Lo que la persona tiene o va a mercar, si viene de "Armar el menú": se prioriza al proponer. */
  focus: string[];
  /** Estilo elegido al armar el menú; orienta la propuesta. */
  style: MenuStyle | null;
  /** Proponer apenas se abre, sin pasar por el formulario (viene de «Mixto»). */
  autoPropose: boolean;
  /** Vuelve a elegir cómo armar el menú, sin perder la lista. */
  onBack: () => void;
  /** Lo que se iba a mercar y no usa ninguna receta con esos cambios. */
  leftoverFor: (changes: ProposedChange[]) => string[];
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
  focus,
  style,
  autoPropose,
  onBack,
  leftoverFor,
}: AssistantPanelProps) {
  const proposesOnOpen = autoPropose && canPropose(initialQuota);
  const [state, setState] = useState<PanelState>(
    proposesOnOpen ? { kind: "loading", slow: false } : { kind: "form" },
  );
  const [values, setValues] = useState<AssistantFormValues>({
    mode: "propose",
    instruction: "",
    onlyEmpty: true,
  });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [quota, setQuota] = useState(initialQuota);
  const [addLeftover, setAddLeftover] = useState(true);
  const requestId = useRef(0);
  const mounted = useRef(true);
  const proposed = useRef(false);

  // Si el panel se cierra mientras espera, la respuesta que llegue después se ignora.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const ask = async (request: AssistantFormValues) => {
    setValues(request);
    const id = ++requestId.current;
    setState({ kind: "loading", slow: false });
    const slowTimer = setTimeout(
      () => mounted.current && id === requestId.current && setState({ kind: "loading", slow: true }),
      SLOW_NOTICE_MS,
    );
    const result = await askAssistant({
      weekStart,
      ...request,
      // Solo el modo Ajustar usa la instrucción; no se arrastra a los otros modos.
      instruction: request.mode === "adjust" ? request.instruction : "",
      focus: request.mode === "propose" ? focus : [],
      style: request.mode === "propose" ? style : null,
    }).catch((): AskAssistantResult => ({
      ok: false,
      error: { kind: "unavailable", detail: "Fallo de red" },
      simulated: false,
      quota: null,
    }));
    clearTimeout(slowTimer);
    if (!mounted.current || id !== requestId.current) return;
    if (result.quota) setQuota((current) => ({ ...current, ...result.quota }));
    if (result.ok) setSelected(new Set(result.changes.map((_, index) => index)));
    setState({ kind: "done", result });
  };

  // Una sola consulta aunque el efecto corra dos veces (modo estricto de desarrollo).
  const proposeNow = useEffectEvent(() => {
    if (proposed.current) return;
    proposed.current = true;
    void ask(values);
  });
  useEffect(() => {
    if (proposesOnOpen) proposeNow();
  }, [proposesOnOpen]);

  const focusNote = (focus.length > 0 || style) && (
    <div className="flex flex-col gap-1 rounded-md bg-sunken px-3 py-2.5 text-sm">
      {focus.length > 0 && (
        <p>
          <span className="font-medium">Con tu lista:</span> {focus.join(", ")}. Al proponer, el asistente
          prioriza recetas que lo usen.
        </p>
      )}
      {style && (
        <p>
          <span className="font-medium">Estilo:</span> {MENU_STYLE_LABELS[style].toLocaleLowerCase("es")}.
        </p>
      )}
    </div>
  );

  const backLink = (
    <button
      type="button"
      onClick={onBack}
      className="flex w-fit items-center gap-1 text-sm text-muted transition-colors duration-(--dur-fast) ease-out hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Cambiar cómo armar el menú
    </button>
  );

  if (state.kind === "form") {
    if (!hasAssistant(quota)) {
      if (!canUseFreeMenu(quota)) {
        return (
          <AssistantError kind={quota.plan === "free" ? "free_menu_used" : "not_entitled"} onBack={onBack} />
        );
      }
      return (
        <div className="flex flex-col gap-5">
          {backLink}
          <p className="text-xs text-muted" aria-live="polite">
            Plan Gratis · te queda <span className="font-medium text-ink">1 menú gratis</span> esta semana.
            Ajustar y revisar notas son de los planes Básico y Pro.
          </p>
          {focusNote}
          <AssistantRequestForm
            initial={{ ...values, mode: "propose" }}
            onlyPropose
            hasMeals={slots.length > 0}
            notesCount={notesCount}
            onSubmit={ask}
          />
        </div>
      );
    }
    const remaining = remainingRequests(quota);
    return (
      <div className="flex flex-col gap-5">
        {backLink}
        <p className="text-xs text-muted" aria-live="polite">
          {remaining === null ? (
            `Plan ${PLAN_NAMES[quota.plan]} · consultas sin límite.`
          ) : (
            <>
              Plan {PLAN_NAMES[quota.plan]} · te quedan{" "}
              <span className="font-medium text-ink tabular-nums">{remaining}</span> de {quota.dailyLimit}{" "}
              consultas hoy. Se renuevan a medianoche.
            </>
          )}
        </p>
        {focusNote}
        {remaining === 0 ? (
          <AssistantError kind="limit_reached" onBack={onBack} />
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

      {chosen.length > 0 && (
        <LeftoverPurchases names={leftoverFor(chosen)} checked={addLeftover} onChange={setAddLeftover} />
      )}

      {/* Fijo abajo: con muchas sugerencias, aplicar no debe exigir bajar hasta el final. */}
      <div className="sticky -bottom-5 -mx-5 -mb-5 flex flex-wrap gap-2 border-t border-hairline bg-surface px-5 py-3">
        {chosen.length > 0 && (
          <Button onClick={() => onApply(chosen, addLeftover)}>
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
