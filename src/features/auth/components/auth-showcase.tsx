import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { formatCop } from "@/domain/money";
import { cn } from "@/ui/cn";

/*
 * Muestra de cómo se ve Olla por dentro, para el panel de ingreso y registro. Los platos y
 * los costos son los del catálogo de base para 4 personas; es ilustración, no datos del usuario.
 */
const SAMPLE_DAYS = [
  {
    label: "Lun",
    date: 3,
    meals: [
      { meal: "Desayuno", name: "Changua", cost: 8286 },
      { meal: "Almuerzo", name: "Ajiaco", cost: 20716 },
      { meal: "Comida", name: "Arepa con queso", cost: 8960 },
    ],
  },
  {
    label: "Mar",
    date: 4,
    today: true,
    meals: [
      { meal: "Desayuno", name: "Calentado", cost: 9627 },
      { meal: "Almuerzo", name: "Sudado de pollo", cost: 18371 },
      { meal: "Comida", name: "Sopa de verduras", cost: 4929 },
    ],
  },
  {
    label: "Mié",
    date: 5,
    meals: [
      { meal: "Desayuno", name: "Huevos pericos", cost: 6466 },
      { meal: "Almuerzo", name: "Lentejas guisadas", cost: 6817 },
      { meal: "Comida", name: "Crema de ahuyama", cost: 4925 },
    ],
  },
];

const SAMPLE_MARKET = [
  { name: "Papa criolla", amount: "2 lb", cost: 6400, bought: true },
  { name: "Pechuga de pollo", amount: "1 kg", cost: 18900, bought: true },
  { name: "Mazorca", amount: "4 und", cost: 6000, bought: false },
  { name: "Guascas", amount: "1 atado", cost: 1500, bought: false },
  { name: "Ahuyama", amount: "1 ½ lb", cost: 3600, bought: false },
];

const WEEK_TOTAL_COP = 182_400;

const stagger = (step: number): CSSProperties => ({ animationDelay: `${step * 80}ms` });

function WeekCard() {
  return (
    <div
      className="animate-rise rounded-md border border-hairline bg-surface p-4 shadow-raised"
      style={stagger(1)}
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3">
        <div>
          <p className="text-xs text-muted">Semana del 3 al 9 de noviembre</p>
          <p className="font-display text-lg font-semibold">Lo que vamos a comer</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Mercado estimado</p>
          <p className="font-display text-lg font-semibold tabular-nums">{formatCop(WEEK_TOTAL_COP)}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {SAMPLE_DAYS.map((day) => (
          <div key={day.label} className="flex min-w-0 flex-col gap-1.5">
            <p className="flex items-baseline gap-1.5 border-b-2 border-ink pb-1">
              <span className="letrero text-base">{day.label}</span>
              <span className={cn("text-xs text-muted", day.today && "marcador text-ink")}>{day.date}</span>
            </p>
            {day.meals.map((item) => (
              <div key={item.meal} className="flex flex-col rounded-sm border border-hairline px-2 py-1.5">
                <span className="text-[11px] text-muted">{item.meal}</span>
                <span className="truncate text-[13px] font-medium">{item.name}</span>
                <span className="text-[11px] text-muted tabular-nums">{formatCop(item.cost)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Como el tiquete de la tienda de barrio: lo que hay que comprar, con lo ya comprado tachado. */
function MarketTicket({ className }: { className?: string }) {
  const bought = SAMPLE_MARKET.filter((item) => item.bought).length;
  return (
    <div
      className={cn("animate-rise rounded-md border border-hairline bg-surface p-4 shadow-raised", className)}
      style={stagger(3)}
    >
      <div className="flex items-baseline justify-between">
        <p className="letrero text-base">Mercado</p>
        <p className="text-[11px] text-muted">
          {bought} de {SAMPLE_MARKET.length} comprados
        </p>
      </div>
      <ul className="mt-2.5 flex flex-col gap-1.5 text-[13px]">
        {SAMPLE_MARKET.map((item) => (
          <li key={item.name} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-sm border",
                item.bought ? "border-cilantro bg-cilantro text-on-cilantro" : "border-hairline-strong",
              )}
            >
              {item.bought && <Check className="size-3" strokeWidth={3} />}
            </span>
            <span className={cn("truncate", item.bought && "text-muted line-through")}>{item.name}</span>
            <span className="min-w-3 flex-1 translate-y-1 border-b border-dotted border-hairline-strong" />
            <span className="text-muted tabular-nums">{formatCop(item.cost)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 border-t border-dashed border-hairline-strong pt-2 text-[11px] text-muted">
        Ya tienes en casa: arroz, huevos y cebolla.
      </p>
    </div>
  );
}

/**
 * Panel de la derecha en ingreso y registro: enseña el producto en vez de decorarlo. Cabe en
 * la altura de la ventana; en pantallas bajas se queda solo la muestra.
 */
export function AuthShowcase({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "m-3 flex-col justify-between gap-6 overflow-hidden rounded-md bg-sunken p-8 xl:px-12 [@media(max-height:680px)]:justify-center",
        className,
      )}
    >
      <p className="letrero text-sm text-muted [@media(max-height:680px)]:hidden">Una semana en Olla</p>
      <div aria-hidden className="relative mx-auto w-full max-w-[500px] pr-10 pb-28">
        <WeekCard />
        <MarketTicket className="absolute right-0 bottom-0 w-[250px] xl:-right-6" />
      </div>
      <div
        className="flex max-w-md animate-rise flex-col gap-1.5 [@media(max-height:680px)]:hidden"
        style={stagger(4)}
      >
        <h2 className="font-display text-xl font-semibold">El mercado sale solo del menú</h2>
        <p className="text-sm text-muted">
          Olla suma lo que se repite, resta lo que ya hay en la despensa y te dice cuánto vas a gastar en la
          semana, en pesos.
        </p>
      </div>
    </aside>
  );
}
