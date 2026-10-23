import type { NutritionEstimate } from "@/domain/nutrition";
import { cn } from "@/ui/cn";

export type DayNutrition = NutritionEstimate;

const WHOLE = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

/** "≈ 1.920 kcal · 85 g proteína", por persona y aproximado; nada si el día no tiene comidas. */
export function DayNutritionLine({
  nutrition,
  className,
}: {
  nutrition: DayNutrition | undefined;
  className?: string;
}) {
  if (!nutrition || nutrition.totals.kcal === 0) return null;
  const { kcal, protein } = nutrition.totals;
  return (
    <span
      className={cn("text-xs text-muted tabular-nums", className)}
      title="Aproximado, por persona. Valores de referencia; no es consejo nutricional."
    >
      ≈ {WHOLE.format(kcal)} kcal · {WHOLE.format(protein)} g prot.
      <span className="sr-only"> por persona, aproximado</span>
    </span>
  );
}
