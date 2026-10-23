import { Check } from "lucide-react";
import Link from "next/link";
import { formatCop } from "@/domain/money";
import { planCardClasses } from "@/features/billing/components/plan-card";
import {
  FREE_ASSISTANT,
  INCLUDED_IN_ALL,
  PLAN_NAMES,
  PLAN_PITCH,
  type PlanPrice,
} from "@/features/billing/plans";
import type { Plan } from "@/features/entitlements/quota";
import { buttonClasses } from "@/ui/button";

const PLANS: Plan[] = ["free", "basic", "pro"];

const EXTRAS: Record<Plan, string[]> = {
  free: [],
  basic: ["Nutrición y metas"],
  pro: ["Nutrición y metas", "7 días gratis para probarlo"],
};

/** Los precios salen de la base, como en la página de planes; sin ellos solo se nombran los planes. */
export function LandingPricing({ prices }: { prices: PlanPrice[] }) {
  const monthly = (plan: Plan) => prices.find((price) => price.plan === plan && price.period === "month");
  return (
    <section id="precios" className="scroll-mt-20 border-t border-hairline">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-20 md:px-8 md:py-28">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="letrero text-sm text-muted">Precios</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Todo Olla es gratis</h2>
          <p className="text-lg leading-relaxed text-muted">
            El plan Gratis trae un menú del asistente por semana; los planes suman más consultas, ajustes con
            tus palabras y la nutrición. Se pagan por mes o por trimestre, con tarjeta, PSE o Nequi, y no se
            renuevan solos.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const price = monthly(plan);
            const featured = plan === "pro";
            return (
              <div key={plan} className={planCardClasses(featured, "p-6")}>
                <div className="flex flex-col gap-1">
                  <h3 className="letrero text-2xl">{PLAN_NAMES[plan]}</h3>
                  <p className="text-sm text-muted">{PLAN_PITCH[plan]}</p>
                </div>
                <p className="flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-semibold tabular-nums">
                    {plan === "free" ? formatCop(0) : price ? formatCop(price.amountCop) : "—"}
                  </span>
                  <span className="text-sm text-muted">{plan === "free" ? "siempre" : "al mes"}</span>
                </p>
                <ul className="flex flex-1 flex-col gap-2 text-sm">
                  <li className="font-medium">
                    {plan === "free"
                      ? FREE_ASSISTANT
                      : price
                        ? `Asistente: ${price.aiDailyLimit} consultas al día`
                        : "Con asistente"}
                  </li>
                  {[...INCLUDED_IN_ALL, ...EXTRAS[plan]].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-cilantro" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registro"
                  className={buttonClasses({
                    variant: featured ? "primary" : "secondary",
                    className: "w-full",
                  })}
                >
                  {plan === "free" ? "Empezar gratis" : plan === "pro" ? "Probar Pro gratis" : "Empezar"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
