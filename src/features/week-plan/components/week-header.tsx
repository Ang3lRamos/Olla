import { MessageSquareText } from "lucide-react";
import type { IsoDate } from "@/domain/week";
import { MAX_PEOPLE } from "@/features/household/schemas";
import { Button } from "@/ui/button";
import { NumberStepper } from "@/ui/number-stepper";
import { WeekNav } from "./week-nav";

interface WeekHeaderProps {
  weekStart: IsoDate;
  isCurrentWeek: boolean;
  people: number;
  onPeopleChange: (people: number) => void;
  onOpenAssistant: () => void;
  /** El asistente es del plan Pro; para el resto el botón lo indica. */
  assistantLocked: boolean;
}

export function WeekHeader({
  weekStart,
  isCurrentWeek,
  people,
  onPeopleChange,
  onOpenAssistant,
  assistantLocked,
}: WeekHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-1">
        <WeekNav basePath="/semana" weekStart={weekStart} isCurrentWeek={isCurrentWeek} />
        <h1 className="font-display text-title font-semibold md:text-display">Lo que vamos a comer</h1>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <NumberStepper
          name="people"
          label="Personas esta semana"
          defaultValue={people}
          min={1}
          max={MAX_PEOPLE}
          unit={["persona", "personas"]}
          onValueChange={onPeopleChange}
        />
        <Button
          variant={assistantLocked ? "secondary" : "primary"}
          onClick={onOpenAssistant}
          data-tour="assistant"
        >
          <MessageSquareText className="size-4" aria-hidden />
          Pedir al asistente
          {assistantLocked && (
            <span className="rounded-full border border-hairline-strong px-1.5 text-[11px] font-semibold">
              Pro
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
