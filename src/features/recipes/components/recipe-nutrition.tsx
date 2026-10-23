import Link from "next/link";
import type { NutritionTotals } from "@/domain/nutrition";

const ONE_DECIMAL = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
const WHOLE = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

interface RecipeNutritionProps {
  perServing: NutritionTotals;
  missing: string[];
}

/** Aporte por porción, siempre como estimado: valores de referencia, no una medición. */
export function RecipeNutrition({ perServing, missing }: RecipeNutritionProps) {
  const facts: Array<[string, number, string]> = [
    ["Proteína", perServing.protein, "g"],
    ["Carbohidratos", perServing.carbs, "g"],
    ["de ellos azúcares", perServing.sugar, "g"],
    ["Grasa", perServing.fat, "g"],
    ["Fibra", perServing.fiber, "g"],
  ];
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
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        {facts.map(([label, value, unit]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-2 border-b border-dashed border-hairline py-1"
          >
            <dt className={label.startsWith("de ellos") ? "pl-3 text-muted" : "text-muted"}>{label}</dt>
            <dd className="font-medium tabular-nums">
              {ONE_DECIMAL.format(value)} {unit}
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
