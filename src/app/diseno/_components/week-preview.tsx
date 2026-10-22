import { ChevronLeft, ChevronRight, MessageSquareText, Minus, Plus, Users } from "lucide-react";
import { Button } from "@/ui/button";
import { PEOPLE } from "./sample-week";
import { WeekDayMobile } from "./week-day-mobile";
import { WeekGrid } from "./week-grid";
import { WeekSummary } from "./week-summary";

export function WeekPreview() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-sm text-muted">
            <Button variant="ghost" size="sm" className="-ml-2 px-1.5" aria-label="Semana anterior">
              <ChevronLeft className="size-4" />
            </Button>
            Semana del 19 al 25 de octubre
            <Button variant="ghost" size="sm" className="px-1.5" aria-label="Semana siguiente">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <h2 className="font-display text-title font-semibold md:text-display">Lo que vamos a comer</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 items-center rounded-md border border-hairline-strong bg-surface">
            <Button variant="ghost" size="sm" className="px-2" aria-label="Una persona menos">
              <Minus className="size-3.5" />
            </Button>
            <span className="flex items-center gap-1.5 px-1 text-sm tabular-nums">
              <Users className="size-3.5 text-muted" aria-hidden />
              {PEOPLE} personas
            </span>
            <Button variant="ghost" size="sm" className="px-2" aria-label="Una persona más">
              <Plus className="size-3.5" />
            </Button>
          </div>
          <Button variant="secondary" size="sm">
            Ver mercado
          </Button>
          <Button size="sm">
            <MessageSquareText className="size-4" aria-hidden />
            Pedir al asistente
          </Button>
        </div>
      </header>

      <WeekSummary />
      <WeekGrid />
      <WeekDayMobile />
    </section>
  );
}
