"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/ui/cn";

const MIN_SCALE = 0.55;

/**
 * Encoge su contenido (sin agrandarlo) para que quepa en el alto que le deja el contenedor.
 * Escala con transform, así no cambia el layout ni hay que duplicar tamaños por breakpoint.
 */
export function FitToHeight({ children, className }: { children: ReactNode; className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;
    const fit = () => {
      const scale = Math.min(1, Math.max(MIN_SCALE, frame.clientHeight / content.offsetHeight));
      content.style.transform = scale < 1 ? `scale(${scale})` : "";
    };
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className={cn("flex min-h-0 flex-1 items-center justify-center", className)}>
      <div ref={contentRef} className="w-full shrink-0 origin-center">
        {children}
      </div>
    </div>
  );
}
