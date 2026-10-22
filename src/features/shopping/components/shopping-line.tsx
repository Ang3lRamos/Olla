import Link from "next/link";
import { formatCop } from "@/domain/money";
import type { ShoppingItem } from "@/domain/shopping-status";
import { formatQuantity } from "@/domain/units";
import { Checkbox } from "@/ui/checkbox";
import { cn } from "@/ui/cn";

interface ShoppingLineProps {
  item: ShoppingItem;
  /** Costo de lo que falta comprar; null si el ingrediente no tiene precio. */
  costCop: number | null;
  onToggle: (checked: boolean) => void;
}

export function ShoppingLine({ item, costCop, onToggle }: ShoppingLineProps) {
  const bought = item.status === "bought";

  return (
    <li className="flex items-start justify-between gap-3 py-2.5 text-[15px]">
      <Checkbox
        checked={bought}
        onChange={(event) => onToggle(event.target.checked)}
        className="min-w-0"
        label={
          <span className="flex min-w-0 flex-col">
            <span>
              {item.name}{" "}
              <span className="text-muted">· {formatQuantity(bought ? item.toBuy : item.remaining)}</span>
            </span>
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
        {costCop === null ? (
          <Link
            href="/presupuesto"
            className="text-xs text-muted underline decoration-hairline-strong underline-offset-4"
          >
            sin precio
          </Link>
        ) : (
          formatCop(costCop)
        )}
      </span>
    </li>
  );
}
