import { formatCop } from "@/domain/money";
import type { BaseQuantity } from "@/domain/types";
import { formatQuantity } from "@/domain/units";
import { Checkbox } from "@/ui/checkbox";

// Datos de ejemplo para la dirección visual; los precios no son reales.
const SAMPLE_GROUPS: Array<{
  label: string;
  lines: Array<{ name: string; toBuy: BaseQuantity; costCop: number; checked?: boolean; pantry?: string }>;
}> = [
  {
    label: "Verduras",
    lines: [
      { name: "Cebolla cabezona", toBuy: { amount: 4, unit: "unit" }, costCop: 3600, checked: true },
      { name: "Papa pastusa", toBuy: { amount: 3000, unit: "g" }, costCop: 9600 },
      { name: "Tomate chonto", toBuy: { amount: 1200, unit: "g" }, costCop: 5400, pantry: "300 g en casa" },
    ],
  },
  {
    label: "Proteínas",
    lines: [
      { name: "Pollo en presas", toBuy: { amount: 2000, unit: "g" }, costCop: 26000 },
      { name: "Huevos", toBuy: { amount: 30, unit: "unit" }, costCop: 18000, checked: true },
    ],
  },
  {
    label: "Granos",
    lines: [{ name: "Arroz", toBuy: { amount: 2500, unit: "g" }, costCop: 14000, pantry: "1 kg en casa" }],
  },
];

const total = SAMPLE_GROUPS.flatMap((group) => group.lines).reduce((sum, line) => sum + line.costCop, 0);

export function ReceiptPreview() {
  return (
    <section className="w-full max-w-sm rounded-sm bg-surface px-5 pt-5 pb-6 shadow-raised">
      <header className="flex items-baseline justify-between border-b-2 border-ink pb-2">
        <h2 className="letrero text-2xl">Mercado</h2>
        <p className="text-xs text-muted">19–25 oct · 4 personas</p>
      </header>

      {SAMPLE_GROUPS.map((group) => (
        <div key={group.label} className="border-b border-dashed border-hairline-strong py-3">
          <h3 className="mb-2 letrero text-xs text-muted">{group.label}</h3>
          <ul className="flex flex-col gap-2.5">
            {group.lines.map((line) => (
              <li key={line.name} className="flex items-start justify-between gap-3 text-[15px]">
                <Checkbox
                  strikeWhenChecked
                  defaultChecked={line.checked}
                  label={
                    <span className="flex flex-col">
                      <span>
                        {line.name} <span className="text-muted">· {formatQuantity(line.toBuy)}</span>
                      </span>
                      {line.pantry && <span className="text-xs text-cilantro">Restado: {line.pantry}</span>}
                    </span>
                  }
                />
                <span className="pt-0.5 tabular-nums">{formatCop(line.costCop)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <footer className="flex items-baseline justify-between pt-4">
        <span className="text-sm text-muted">Total estimado</span>
        <span className="letrero text-3xl tabular-nums">{formatCop(total)}</span>
      </footer>
      <p className="mt-1 text-right text-xs text-muted">Precios de referencia · edítalos en Presupuesto</p>
    </section>
  );
}
