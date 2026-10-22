import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { addDays, formatWeekRange, type IsoDate } from "@/domain/week";
import { MAX_PEOPLE } from "@/features/household/schemas";
import { buttonClasses } from "@/ui/button";
import { NumberStepper } from "@/ui/number-stepper";

interface WeekHeaderProps {
  weekStart: IsoDate;
  isCurrentWeek: boolean;
  people: number;
  onPeopleChange: (people: number) => void;
}

const weekHref = (weekStart: IsoDate) => `/semana?semana=${weekStart}`;

export function WeekHeader({ weekStart, isCurrentWeek, people, onPeopleChange }: WeekHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-1">
        <nav aria-label="Cambiar de semana" className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <Link
            href={weekHref(addDays(weekStart, -7))}
            aria-label="Semana anterior"
            className={buttonClasses({ variant: "ghost", size: "sm", className: "-ml-2 px-1.5" })}
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span aria-live="polite">{formatWeekRange(weekStart)}</span>
          <Link
            href={weekHref(addDays(weekStart, 7))}
            aria-label="Semana siguiente"
            className={buttonClasses({ variant: "ghost", size: "sm", className: "px-1.5" })}
          >
            <ChevronRight className="size-4" />
          </Link>
          {!isCurrentWeek && (
            <Link
              href="/semana"
              className={buttonClasses({ variant: "secondary", size: "sm", className: "ml-1" })}
            >
              Esta semana
            </Link>
          )}
        </nav>
        <h1 className="font-display text-title font-semibold md:text-display">Lo que vamos a comer</h1>
      </div>

      <NumberStepper
        name="people"
        label="Personas esta semana"
        defaultValue={people}
        min={1}
        max={MAX_PEOPLE}
        unit={["persona", "personas"]}
        onValueChange={onPeopleChange}
      />
    </header>
  );
}
