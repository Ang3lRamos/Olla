import type { CSSProperties } from "react";
import { SampleMarketTicket, SampleWeekCard } from "@/features/marketing/components/sample-week";
import { cn } from "@/ui/cn";
import { FitToHeight } from "./fit-to-height";

const stagger = (step: number): CSSProperties => ({ animationDelay: `${step * 80}ms` });

/**
 * Panel de la derecha en ingreso y registro: enseña el producto en vez de decorarlo. Cabe en
 * la altura de la ventana: el texto siempre se ve y la muestra se encoge si no hay espacio.
 */
export function AuthShowcase({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "m-3 flex-col gap-6 overflow-hidden rounded-md bg-sunken p-8 xl:px-12 [@media(max-height:720px)]:gap-4 [@media(max-height:720px)]:py-6",
        className,
      )}
    >
      <p className="letrero text-sm text-muted">Una semana en Olla</p>
      <FitToHeight>
        <div aria-hidden className="relative mx-auto w-full max-w-[500px] pr-10 pb-28">
          <SampleWeekCard />
          <SampleMarketTicket className="absolute right-0 bottom-0 w-[250px] xl:-right-6" />
        </div>
      </FitToHeight>
      <div className="flex max-w-md shrink-0 animate-rise flex-col gap-1.5" style={stagger(4)}>
        <h2 className="font-display text-xl font-semibold">El mercado sale solo del menú</h2>
        <p className="text-sm text-muted">
          Olla suma lo que se repite, resta lo que ya hay en la despensa y te dice cuánto vas a gastar en la
          semana, en pesos.
        </p>
      </div>
    </aside>
  );
}
