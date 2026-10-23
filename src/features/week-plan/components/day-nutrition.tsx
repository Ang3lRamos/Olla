import { Check } from "lucide-react";
import type { NutritionEstimate } from "@/domain/nutrition";
import { goalProgress, NUTRIENT_LABELS, type NutritionGoal } from "@/domain/nutrition-goals";
import { cn } from "@/ui/cn";

export type DayNutrition = NutritionEstimate;

const WHOLE = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

interface DayNutritionLineProps {
  nutrition: DayNutrition | undefined;
  goals: NutritionGoal[];
  className?: string;
}

/**
 * Lo de una persona en el día: "≈ 1.920 kcal · 85 g prot." y, si puso metas, cómo va frente a
 * cada una. Aproximado; nada si el día no tiene comidas.
 */
export function DayNutritionLine({ nutrition, goals, className }: DayNutritionLineProps) {
  if (!nutrition || nutrition.totals.kcal === 0) return null;
  const { kcal, protein } = nutrition.totals;
  const progress = goalProgress(nutrition.totals, goals);
  return (
    <span className={cn("flex flex-col gap-1", className)}>
      <span
        className="text-xs text-muted tabular-nums"
        title="Aproximado, por persona. Valores de referencia; no es consejo nutricional."
      >
        ≈ {WHOLE.format(kcal)} kcal · {WHOLE.format(protein)} g prot.
        <span className="sr-only"> por persona, aproximado</span>
      </span>
      {progress.length > 0 && (
        <ul className="flex flex-col gap-1" aria-label="Tus metas del día">
          {progress.map((goal) => {
            const { name, short, unit } = NUTRIENT_LABELS[goal.nutrient];
            // Pasarse de un máximo se marca; quedarse corto de un mínimo solo se ve en la barra.
            const over = goal.direction === "max" && !goal.met;
            return (
              <li key={goal.nutrient} className="flex flex-col gap-0.5 text-[11px] tabular-nums">
                <span className="flex items-center justify-between gap-1">
                  <span className="text-muted">{short}</span>
                  <span className={cn("flex items-center gap-0.5", over ? "text-danger" : "text-ink")}>
                    {goal.met && <Check className="size-3 text-cilantro" aria-hidden />}
                    {WHOLE.format(goal.value)}/{WHOLE.format(goal.target)}
                  </span>
                  <span className="sr-only">
                    {name}: {WHOLE.format(goal.value)} de {goal.direction === "min" ? "al menos" : "máximo"}{" "}
                    {WHOLE.format(goal.target)} {unit},{" "}
                    {goal.met ? "cumplida" : over ? "por encima" : "por debajo"}
                  </span>
                </span>
                <span className="h-1 overflow-hidden rounded-full bg-hairline" aria-hidden>
                  <span
                    className={cn(
                      "block h-full origin-left rounded-full transition-transform duration-(--dur-slow) ease-out",
                      over ? "bg-danger" : goal.met ? "bg-cilantro" : "bg-muted",
                    )}
                    style={{ transform: `scaleX(${Math.min(goal.ratio, 1)})` }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </span>
  );
}
