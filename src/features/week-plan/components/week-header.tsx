import { ChefHat } from "lucide-react";
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
  onOpenMenuBuilder: () => void;
}

export function WeekHeader({
  weekStart,
  isCurrentWeek,
  people,
  onPeopleChange,
  onOpenMenuBuilder,
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
        <Button onClick={onOpenMenuBuilder} data-tour="menu-builder">
          <ChefHat className="size-4" aria-hidden />
          Armar el menú
        </Button>
      </div>
    </header>
  );
}
