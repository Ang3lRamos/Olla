"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/ui/button";
import { TOUR_QUERY, TOUR_SEEN_KEY, TOUR_STEPS } from "../tour-steps";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 6;
const CARD_WIDTH = 320;
const GAP = 12;

const visibleTarget = (name: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)].find(
    (element) => element.getClientRects().length > 0,
  );

function readSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    // Sin almacenamiento (modo privado): se mostraría de nuevo, que es lo menos grave.
  }
}

/**
 * Recorrido de la primera vez por la semana: resalta cada parte con un recorte sobre el fondo
 * y explica para qué sirve. Se salta con Escape o "Saltar"; se repite desde la ayuda.
 */
export function GuidedTour() {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.has(TOUR_QUERY);
    if (requested) {
      params.delete(TOUR_QUERY);
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
    // Se espera a que la semana pinte; el recorrido no debe tapar la primera impresión.
    if (requested || !readSeen()) {
      const timer = setTimeout(() => setStep(0), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = useCallback(() => {
    markSeen();
    setStep(null);
  }, []);

  const current = step === null ? null : TOUR_STEPS[step];

  useLayoutEffect(() => {
    if (!current) return;
    const target = visibleTarget(current.target);
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
    // Sin elemento visible (p. ej. otra pantalla), la tarjeta va al centro sin recorte.
    const measure = () => {
      const box = target?.getBoundingClientRect();
      setRect(box ? { top: box.top, left: box.left, width: box.width, height: box.height } : null);
    };
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [current]);

  useEffect(() => {
    if (step === null) return;
    cardRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [step, close]);

  if (step === null || !current) return null;
  const last = step === TOUR_STEPS.length - 1;
  const cardStyle = placeCard(rect);

  return (
    <div className="fixed inset-0 z-50" aria-live="polite">
      {/* El recorte: un hueco sobre el fondo oscuro alrededor de lo que se explica. */}
      <div
        aria-hidden
        className="pointer-events-auto fixed rounded-md transition-[top,left,width,height] duration-(--dur-slow) ease-in-out"
        style={
          rect
            ? {
                top: rect.top - PADDING,
                left: rect.left - PADDING,
                width: rect.width + PADDING * 2,
                height: rect.height + PADDING * 2,
                boxShadow: "0 0 0 9999px var(--scrim)",
              }
            : { inset: 0, background: "var(--scrim)" }
        }
        onClick={close}
      />
      <div
        ref={cardRef}
        key={step}
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={cardStyle}
        className="fixed flex animate-rise flex-col gap-3 rounded-md border border-hairline bg-surface p-4 text-ink shadow-raised outline-none"
      >
        <p className="text-xs text-muted">
          Paso {step + 1} de {TOUR_STEPS.length}
        </p>
        <h2 id={titleId} className="font-display text-lg font-semibold">
          {current.title}
        </h2>
        <p className="text-sm text-muted">{current.body}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted" onClick={close}>
            Saltar
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setStep(step - 1)}>
                Atrás
              </Button>
            )}
            <Button size="sm" onClick={() => (last ? close() : setStep(step + 1))}>
              {last ? "Empezar" : "Siguiente"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Debajo del elemento si cabe; si no, encima. Sin elemento visible, al centro. */
function placeCard(rect: Rect | null): React.CSSProperties {
  const width = Math.min(CARD_WIDTH, window.innerWidth - 32);
  if (!rect) return { width, top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  const left = Math.min(Math.max(rect.left, 16), window.innerWidth - width - 16);
  const below = rect.top + rect.height + PADDING + GAP;
  const fitsBelow = below + 200 < window.innerHeight;
  return fitsBelow
    ? { width, left, top: below }
    : { width, left, bottom: window.innerHeight - rect.top + PADDING + GAP };
}
