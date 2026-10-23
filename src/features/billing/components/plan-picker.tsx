"use client";

import { Check, MessageSquareText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatCop } from "@/domain/money";
import type { Plan } from "@/features/entitlements/quota";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { FormMessage } from "@/ui/form-message";
import { startCheckout, startTrial } from "../actions";
import { planCardClasses } from "./plan-card";
import {
  INCLUDED_IN_ALL,
  PERIOD_LABELS,
  PERIODS,
  PLAN_NAMES,
  PLAN_PITCH,
  quarterlySavingsPercent,
  type PaidPlan,
  type Period,
  type PlanPrice,
} from "../plans";

interface PlanPickerProps {
  prices: PlanPrice[];
  currentPlan: Plan;
  canStartTrial: boolean;
  paymentsEnabled: boolean;
}

export function PlanPicker({ prices, currentPlan, canStartTrial, paymentsEnabled }: PlanPickerProps) {
  const [period, setPeriod] = useState<Period>("month");
  const [error, setError] = useState<string>();
  const [pendingPlan, setPendingPlan] = useState<PaidPlan | "trial" | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const savings = quarterlySavingsPercent(prices, "pro");

  const pay = (plan: PaidPlan) => {
    setPendingPlan(plan);
    setError(undefined);
    startTransition(async () => {
      const result = await startCheckout({ plan, period });
      if (result.ok) {
        // El checkout es de Wompi: la persona sale de Olla y vuelve a /planes/resultado.
        window.location.assign(result.url);
        return;
      }
      setError(result.error);
      setPendingPlan(null);
    });
  };

  const trial = () => {
    setPendingPlan("trial");
    setError(undefined);
    startTransition(async () => {
      const result = await startTrial();
      if (result.ok) router.push("/semana");
      else setError(result.error);
      setPendingPlan(null);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {canStartTrial && (
        <div className="flex animate-rise flex-col gap-3 rounded-md border border-ink p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">Prueba Pro 7 días gratis</p>
            <p className="text-sm text-muted">
              Sin tarjeta y sin cobros después: al terminar vuelves al plan gratis.
            </p>
          </div>
          <Button onClick={trial} loading={pendingPlan === "trial"} className="shrink-0">
            Empezar la prueba
          </Button>
        </div>
      )}

      <div
        role="radiogroup"
        aria-label="Cada cuánto pagar"
        className="inline-flex w-fit rounded-md border border-hairline bg-sunken p-0.5"
      >
        {PERIODS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={period === option}
            onClick={() => setPeriod(option)}
            className={cn(
              "h-8 rounded-sm px-3 text-sm transition-colors duration-(--dur-fast) ease-out",
              period === option ? "bg-surface text-ink shadow-raised" : "text-muted hover:text-ink",
            )}
          >
            {PERIOD_LABELS[option].name}
            {option === "quarter" && savings ? (
              <span className="ml-1.5 text-cilantro">−{savings} %</span>
            ) : null}
          </button>
        ))}
      </div>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <ul className="grid gap-4 md:grid-cols-3">
        {(["free", "basic", "pro"] as const).map((plan, index) => {
          const price = prices.find((item) => item.plan === plan && item.period === period);
          const isCurrent = plan === currentPlan;
          const featured = plan === "pro";
          return (
            <li
              key={plan}
              style={{ animationDelay: `${index * 40}ms` }}
              className={planCardClasses(featured, "animate-rise p-5")}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="letrero text-2xl">{PLAN_NAMES[plan]}</h2>
                  {featured && <span className="text-xs font-medium text-cilantro">El más completo</span>}
                </div>
                <p className="text-sm text-muted">{PLAN_PITCH[plan]}</p>
              </div>

              <p className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {price ? formatCop(price.amountCop) : formatCop(0)}
                </span>
                <span className="text-sm text-muted">{price ? PERIOD_LABELS[period].per : "siempre"}</span>
              </p>

              <ul className="flex flex-1 flex-col gap-2 text-sm">
                <li className="flex items-start gap-2 font-medium">
                  <MessageSquareText
                    className={cn("mt-0.5 size-4 shrink-0", price ? "text-ink" : "text-muted")}
                    aria-hidden
                  />
                  {price ? `Asistente: ${price.aiDailyLimit} consultas al día` : "Sin asistente"}
                </li>
                {INCLUDED_IN_ALL.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-muted">
                    <Check className="mt-0.5 size-4 shrink-0 text-cilantro" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan === "free" ? (
                <p className="h-10 content-center text-sm text-muted">
                  {isCurrent ? "Es tu plan actual" : "Vuelves a él al terminar un plan"}
                </p>
              ) : (
                <Button
                  variant={featured ? "primary" : "secondary"}
                  disabled={!paymentsEnabled || (pendingPlan !== null && pendingPlan !== plan)}
                  loading={pendingPlan === plan}
                  onClick={() => pay(plan)}
                >
                  {isCurrent ? `Renovar ${PLAN_NAMES[plan]}` : `Pagar ${PLAN_NAMES[plan]}`}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
