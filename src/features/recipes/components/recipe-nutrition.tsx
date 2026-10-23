import Link from "next/link";
import type { NutritionTotals } from "@/domain/nutrition";
import type { NutrientKey, NutritionGoal } from "@/domain/nutrition-goals";

const ONE_DECIMAL = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
const WHOLE = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

interface RecipeNutritionProps {
  perServing: NutritionTotals;
  missing: string[];
  /** Metas diarias de la persona: se muestra cuánto de cada una cubre una porción. */
  goals: NutritionGoal[];
}

/** Aporte por porción, siempre como estimado: valores de referencia, no una medición. */
export function RecipeNutrition({ perServing, missing, goals }: RecipeNutritionProps) {
  const facts: Array<[string, NutrientKey]> = [
    ["Proteína", "protein"],
    ["Carbohidratos", "carbs"],
    ["de ellos azúcares", "sugar"],
    ["Grasa", "fat"],
    ["Fibra", "fiber"],
  ];
  const shareOf = (nutrient: NutrientKey) => {
    const goal = goals.find((item) => item.nutrient === nutrient);
    return goal ? Math.round((perServing[nutrient] / goal.target) * 100) : null;
  };
  const kcalShare = shareOf("kcal");
  return (
    <section
      aria-labelledby="nutrition-title"
      className="flex flex-col gap-3 rounded-md border border-hairline p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="nutrition-title" className="text-sm font-medium">
          Aporte aproximado por porción
        </h3>
        <p className="tabular-nums">
          <span className="font-display text-2xl font-semibold">≈ {WHOLE.format(perServing.kcal)}</span>{" "}
          <span className="text-sm text-muted">kcal</span>
          {kcalShare !== null && (
            <span className="block text-right text-xs text-muted">{kcalShare} % de tu meta</span>
          )}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        {facts.map(([label, nutrient]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-2 border-b border-dashed border-hairline py-1"
          >
            <dt className={label.startsWith("de ellos") ? "pl-3 text-muted" : "text-muted"}>{label}</dt>
            <dd className="text-right font-medium tabular-nums">
              {ONE_DECIMAL.format(perServing[nutrient])} g
              {shareOf(nutrient) !== null && (
                <span className="block text-xs font-normal text-muted">{shareOf(nutrient)} % de tu meta</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted">
        Estimado con valores de referencia y las cantidades de la receta; no es consejo nutricional.
        {missing.length > 0 && ` Sin datos de ${missing.join(", ")}: el aporte real es mayor.`}
      </p>
    </section>
  );
}

/** Para quien no tiene un plan pago: se nombra la función, sin mostrar números. */
export function RecipeNutritionTeaser() {
  return (
    <p className="rounded-md border border-dashed border-hairline-strong px-4 py-3 text-sm text-muted">
      Calorías, proteína y más por porción, en los{" "}
      <Link
        href="/planes"
        className="font-medium text-ink underline decoration-hairline-strong underline-offset-4"
      >
        planes Básico y Pro
      </Link>
      .
    </p>
  );
}
