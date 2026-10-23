import Link from "next/link";
import { formatCop } from "@/domain/money";
import { formatQuantity } from "@/domain/units";
import { Checkbox } from "@/ui/checkbox";
import { cn } from "@/ui/cn";
import type { Quantity } from "@/domain/types";
import type { PricedItem } from "../shopping-view";
import { PartialPurchase } from "./partial-purchase";

interface ShoppingLineProps {
  priced: PricedItem;
  onToggle: (checked: boolean) => void;
  /** Lo que se compró de verdad, si no fue todo lo de la lista. */
  onPartial: (quantity: Quantity) => void;
}

export function ShoppingLine({ priced, onToggle, onPartial }: ShoppingLineProps) {
  const { item, purchase, packagesLabel, neededPieces, amountLabel } = priced;
  const bought = item.status === "bought";
  const leftover = purchase.quantity.amount - (bought ? item.toBuy.amount : item.remaining.amount);

  return (
    <li className="flex flex-col gap-1 py-2.5 text-[15px]">
      <div className="flex items-start justify-between gap-3">
        <Checkbox
          strikeWhenChecked
          checked={bought}
          onChange={(event) => onToggle(event.target.checked)}
          className="min-w-0"
          label={
            <span className="flex min-w-0 flex-col">
              <span>
                {item.name} <span className="text-muted">· {amountLabel}</span>
              </span>
              {packagesLabel && (
                <span className="text-xs text-muted">
                  El menú usa {neededPieces ?? formatQuantity(item.needed)}
                  {leftover > 0 && " · lo que sobre queda en la despensa"}
                </span>
              )}
              {item.status === "needs-more" && (
                <span className="text-xs text-ink">
                  Ya compraste {formatQuantity({ amount: item.purchased, unit: item.toBuy.unit })} · faltan{" "}
                  {formatQuantity(item.remaining)}
                </span>
              )}
              {item.fromPantry > 0 && (
                <span className="text-xs text-cilantro">
                  Restado: {formatQuantity({ amount: item.fromPantry, unit: item.toBuy.unit })} en casa
                </span>
              )}
            </span>
          }
        />
        <span className={cn("shrink-0 pt-0.5 tabular-nums", bought && "text-muted")}>
          {purchase.costCop === null ? (
            <Link
              href="/presupuesto"
              className="text-xs text-muted underline decoration-hairline-strong underline-offset-4"
            >
              sin precio
            </Link>
          ) : (
            formatCop(purchase.costCop)
          )}
        </span>
      </div>
      {!bought && (
        <div className="pl-8">
          <PartialPurchase ingredient={priced.ingredient} onSave={onPartial} />
        </div>
      )}
    </li>
  );
}
