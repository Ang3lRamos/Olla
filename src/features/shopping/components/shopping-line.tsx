import Link from "next/link";
import { formatCop } from "@/domain/money";
import { formatQuantity } from "@/domain/units";
import { Checkbox } from "@/ui/checkbox";
import { cn } from "@/ui/cn";
import type { PricedItem } from "../shopping-view";

interface ShoppingLineProps {
  priced: PricedItem;
  onToggle: (checked: boolean) => void;
}

export function ShoppingLine({ priced, onToggle }: ShoppingLineProps) {
  const { item, purchase, packagesLabel, neededPieces } = priced;
  const bought = item.status === "bought";
  // Con paquetes se lee lo que se compra ("1 paquete (450 g)"); sin ellos, solo la cantidad.
  const amount = formatQuantity(purchase.quantity);
  const leftover = purchase.quantity.amount - (bought ? item.toBuy.amount : item.remaining.amount);

  return (
    <li className="flex items-start justify-between gap-3 py-2.5 text-[15px]">
      <Checkbox
        strikeWhenChecked
        checked={bought}
        onChange={(event) => onToggle(event.target.checked)}
        className="min-w-0"
        label={
          <span className="flex min-w-0 flex-col">
            <span>
              {item.name}{" "}
              <span className="text-muted">· {packagesLabel ? `${packagesLabel} (${amount})` : amount}</span>
            </span>
            {packagesLabel && (
              <span className="text-xs text-muted">
                El menú usa {neededPieces ?? formatQuantity(item.needed)}
                {leftover > 0 && " · lo que sobre queda en la despensa"}
              </span>
            )}
            {item.status === "needs-more" && (
              <span className="text-xs text-ink">
                Compraste {formatQuantity({ amount: item.purchased, unit: item.toBuy.unit })} · el menú cambió
                y faltan {formatQuantity(item.remaining)}
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
    </li>
  );
}
