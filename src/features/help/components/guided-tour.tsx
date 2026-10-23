"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/ui/button";
import { TOUR_EVENT, TOUR_QUERY, TOUR_SEEN_KEY, TOUR_STEPS } from "../tour-steps";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 6;
const CARD_WIDTH = 320;
const GAP = 12;
/** Barra superior fija (56 px) más aire: lo resaltado no debe quedar debajo de ella. */
const TOP_OFFSET = 72;
const EDGE = 16;
/** En celular, la barra inferior fija también ocupa espacio. */
const MOBILE_TAB_BAR = 72;
const bottomEdge = () => EDGE + (window.matchMedia("(min-width: 1024px)").matches ? 0 : MOBILE_TAB_BAR);
/** Alto aproximado de la tarjeta antes de medirla. */
const CARD_HEIGHT_GUESS = 220;

/**
 * Lleva el elemento a la vista. Si es más alto que la pantalla (la semana completa), se muestra
 * su comienzo; si no, queda centrado.
 */
function scrollToTarget(target: HTMLElement) {
  const box = target.getBoundingClientRect();
  const tall = box.height > window.innerHeight - TOP_OFFSET - CARD_HEIGHT_GUESS;
  const top = tall
    ? window.scrollY + box.top - TOP_OFFSET
    : window.scrollY + box.top - (window.innerHeight - box.height) / 2;
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
}

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
  const [cardHeight, setCardHeight] = useState(CARD_HEIGHT_GUESS);
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
    const start = () => {
      // Se marca visto al aparecer: recargar a mitad del recorrido no debe repetirlo.
      markSeen();
      setStep(0);
    };
    window.addEventListener(TOUR_EVENT, start);
    // Se espera a que la semana pinte; el recorrido no debe tapar la primera impresión.
    const timer = requested || !readSeen() ? setTimeout(start, 600) : undefined;
    return () => {
      clearTimeout(timer);
      window.removeEventListener(TOUR_EVENT, start);
    };
  }, []);

  const close = useCallback(() => setStep(null), []);

  const current = step === null ? null : TOUR_STEPS[step];

  useLayoutEffect(() => {
    if (!current) return;
    const target = visibleTarget(current.target);
    if (target) scrollToTarget(target);
    // Sin elemento visible (p. ej. otra pantalla), la tarjeta va al centro sin recorte.
    const measure = () => {
      const box = target?.getBoundingClientRect();
      setRect(box ? { top: box.top, left: box.left, width: box.width, height: box.height } : null);
      if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
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
  const cardStyle = placeCard(rect, cardHeight);

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

/**
 * Debajo del elemento si cabe, si no encima; si no cabe en ninguno (un elemento más alto que la
 * pantalla), fija abajo. Siempre dentro de la pantalla. Sin elemento visible, al centro.
 */
function placeCard(rect: Rect | null, height: number): React.CSSProperties {
  const width = Math.min(CARD_WIDTH, window.innerWidth - EDGE * 2);
  if (!rect) return { width, top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  const left = Math.min(Math.max(rect.left, EDGE), window.innerWidth - width - EDGE);
  const below = rect.top + rect.height + PADDING + GAP;
  const above = rect.top - PADDING - GAP - height;
  const top =
    below + height <= window.innerHeight - bottomEdge()
      ? below
      : above >= TOP_OFFSET
        ? above
        : window.innerHeight - height - bottomEdge();
  return { width, left, top: Math.max(top, TOP_OFFSET) };
}
