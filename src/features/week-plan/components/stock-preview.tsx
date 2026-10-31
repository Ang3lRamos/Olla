import { useState } from "react";
import type { PlannedSlot } from "@/domain/week-plan";
import { ChangePreview } from "@/features/assistant/components/change-preview";
import { LeftoverPurchases } from "@/features/assistant/components/leftover-purchases";
import type { ProposedChange } from "@/features/assistant/sanitize";
import { withChanges } from "@/features/assistant/with-changes";
import { Button } from "@/ui/button";
import type { StockPlan } from "../cook-with";

interface StockPreviewProps {
  plan: StockPlan;
  slots: PlannedSlot[];
  recipeName: (recipeId: string | null) => string;
  marketFor: (slots: PlannedSlot[]) => number;
  /** Lo que se iba a mercar y no usa ninguna de las recetas elegidas. */
  leftoverFor: (changes: ProposedChange[]) => string[];
  onApply: (changes: ProposedChange[], addLeftover: boolean) => void;
  onBack: () => void;
}

export function StockPreview({
  plan,
  slots,
  recipeName,
  marketFor,
  leftoverFor,
  onApply,
  onBack,
}: StockPreviewProps) {
  const [selected, setSelected] = useState(() => new Set(plan.changes.map((_, index) => index)));
  const [addLeftover, setAddLeftover] = useState(true);
  const chosen = plan.changes.filter((_, index) => selected.has(index));
  const leftover = leftoverFor(chosen);

  return (
    <div className="flex animate-rise flex-col gap-5">
      <p className="text-[15px]">
        Así quedaría la semana con lo tuyo. Las cantidades y el mercado los recalcula Olla.
      </p>
      {plan.ranOut.length > 0 && (
        <p className="rounded-md bg-sunken px-3 py-2.5 text-sm">
          <span className="font-medium">No alcanzó lo que hay en casa de {plan.ranOut.join(", ")}.</span> Si
          lo agregas a «Lo voy a mercar», Olla puede usarlo en más comidas.
        </p>
      )}
      <ChangePreview
        changes={plan.changes}
        selected={selected}
        onToggle={(index) =>
          setSelected((current) => {
            const next = new Set(current);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
          })
        }
        recipeName={recipeName}
        currentRecipeId={() => null}
        marketNowCop={marketFor(slots)}
        marketAfterCop={marketFor(withChanges(slots, chosen))}
      />
      {chosen.length > 0 && (
        <LeftoverPurchases names={leftover} checked={addLeftover} onChange={setAddLeftover} />
      )}
      <div className="sticky -bottom-5 -mx-5 -mb-5 flex flex-wrap gap-2 border-t border-hairline bg-surface px-5 py-3">
        {chosen.length > 0 && (
          <Button onClick={() => onApply(chosen, addLeftover)}>
            Aplicar {chosen.length} {chosen.length === 1 ? "cambio" : "cambios"}
          </Button>
        )}
        <Button variant="ghost" onClick={onBack}>
          Volver
        </Button>
      </div>
    </div>
  );
}
