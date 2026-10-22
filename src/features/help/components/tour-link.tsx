"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { TOUR_EVENT, TOUR_QUERY } from "../tour-steps";

interface TourLinkProps {
  className?: string;
  children: ReactNode;
  onStart?: () => void;
}

/**
 * Abre el recorrido: si ya se está en la semana lo arranca ahí mismo (no hay navegación que lo
 * dispare); desde otra pantalla lleva a la semana con ?recorrido=1.
 */
export function TourLink({ className, children, onStart }: TourLinkProps) {
  return (
    <Link
      href={`/semana?${TOUR_QUERY}=1`}
      className={className}
      onClick={(event) => {
        onStart?.();
        if (window.location.pathname !== "/semana") return;
        event.preventDefault();
        window.dispatchEvent(new Event(TOUR_EVENT));
      }}
    >
      {children}
    </Link>
  );
}
