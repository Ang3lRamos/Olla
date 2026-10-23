import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { formatCop } from "@/domain/money";
import { cn } from "@/ui/cn";

const STEPS = [
  {
    title: "Elige el menú",
    body: "30 recetas colombianas para empezar, más las tuyas. Cada comida con sus porciones y su costo.",
  },
  {
    title: "El mercado sale solo",
    body: "Suma lo que se repite, resta lo que ya tienes en casa y arma la lista para los días que vas a mercar.",
  },
  {
    title: "Cuida la plata",
    body: "Con tus precios, sabes cuánto cuesta cada día y si la semana cabe en el presupuesto.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 border-y border-hairline bg-sunken/50">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-3 md:px-8 md:py-20">
        {STEPS.map((step, index) => (
          <div key={step.title} className="flex flex-col gap-3 border-t-2 border-ink pt-4">
            <span className="letrero text-4xl leading-none text-muted tabular-nums">{index + 1}</span>
            <h2 className="font-display text-xl font-semibold">{step.title}</h2>
            <p className="leading-relaxed text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureRow({
  eyebrow,
  title,
  body,
  visual,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  body: ReactNode;
  visual: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className={cn("flex flex-col gap-3", reverse && "md:order-2")}>
        <p className="letrero text-sm text-muted">{eyebrow}</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-balance">{title}</h2>
        <div className="text-lg leading-relaxed text-muted">{body}</div>
      </div>
      <div aria-hidden>{visual}</div>
    </div>
  );
}

const PROPOSAL = [
  { slot: "Lun · Almuerzo", from: "Bandeja paisa", to: "Sudado de pollo", saves: 6_120 },
  { slot: "Mié · Comida", from: "Hamburguesas", to: "Arepa con queso", saves: 4_380 },
];

function AssistantPreview() {
  return (
    <div className="rounded-md border border-hairline bg-surface p-4 shadow-raised">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4 text-muted" />
        “Que la semana salga más barata, sin repetir almuerzos”
      </p>
      <ul className="mt-3 flex flex-col divide-y divide-hairline text-sm">
        {PROPOSAL.map((change) => (
          <li
            key={change.slot}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
          >
            <span className="flex flex-col">
              <span className="text-xs text-muted">{change.slot}</span>
              <span>
                <span className="text-muted line-through">{change.from}</span> → {change.to}
              </span>
            </span>
            <span className="text-cilantro tabular-nums">−{formatCop(change.saves)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2 border-t border-hairline pt-3 text-sm">
        <span className="rounded-md bg-accent px-3 py-1.5 font-medium text-on-accent">Aceptar cambios</span>
        <span className="rounded-md px-3 py-1.5 text-muted">Descartar</span>
      </div>
    </div>
  );
}

const DAY_GOALS = [
  { label: "Prot.", value: 96, target: 120, met: false },
  { label: "Fibra", value: 27, target: 25, met: true },
  { label: "Azúc.", value: 31, target: 40, met: true },
];

function NutritionPreview() {
  return (
    <div className="rounded-md border border-hairline bg-surface p-4 shadow-raised">
      <div className="flex items-baseline justify-between border-b border-hairline pb-3">
        <p className="letrero text-base">Martes</p>
        <p className="text-sm text-muted tabular-nums">≈ 1.840 kcal por persona</p>
      </div>
      <ul className="mt-3 flex flex-col gap-2.5 text-sm">
        {DAY_GOALS.map((goal) => (
          <li key={goal.label} className="grid grid-cols-[3.5rem_minmax(0,1fr)_4.5rem] items-center gap-3">
            <span className="text-muted">{goal.label}</span>
            <span className="h-2 rounded-full bg-sunken">
              <span
                className={cn("block h-full rounded-full", goal.met ? "bg-cilantro" : "bg-chart")}
                style={{ width: `${Math.min(goal.value / goal.target, 1) * 100}%` }}
              />
            </span>
            <span className="text-right tabular-nums">
              {goal.value}/{goal.target} g
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeatureRows() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-20 md:px-8 md:py-28">
      <FeatureRow
        eyebrow="Asistente"
        title="Te propone la semana; tú decides qué cambia"
        body={
          <p>
            Pídele un menú más barato, sin cerdo o con lo que hay en la despensa. Ves cada cambio frente a tu
            semana y nada se toca hasta que lo aceptas.
          </p>
        }
        visual={<AssistantPreview />}
      />
      <FeatureRow
        reverse
        eyebrow="Nutrición"
        title="Calorías y proteína aproximadas, contra tus metas"
        body={
          <p>
            Cada receta trae su aporte por porción y cada día te dice cómo va frente a las metas que tú pones.
            Son estimados para orientarte, no consejo médico.
          </p>
        }
        visual={<NutritionPreview />}
      />
    </section>
  );
}
