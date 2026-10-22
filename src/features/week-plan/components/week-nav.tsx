import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { addDays, formatWeekRange, type IsoDate } from "@/domain/week";
import { buttonClasses } from "@/ui/button";

interface WeekNavProps {
  /** Ruta de la página que navega por semanas, p. ej. "/semana" o "/mercado". */
  basePath: string;
  weekStart: IsoDate;
  isCurrentWeek: boolean;
}

export function WeekNav({ basePath, weekStart, isCurrentWeek }: WeekNavProps) {
  const weekHref = (start: IsoDate) => `${basePath}?semana=${start}`;

  return (
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
          href={basePath}
          className={buttonClasses({ variant: "secondary", size: "sm", className: "ml-1" })}
        >
          Esta semana
        </Link>
      )}
    </nav>
  );
}
