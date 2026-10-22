import { Package } from "lucide-react";
import Link from "next/link";
import { formatCop } from "@/domain/money";
import type { ShoppingItem } from "@/domain/shopping-status";
import { formatQuantity } from "@/domain/units";
import { buttonClasses } from "@/ui/button";
import { cn } from "@/ui/cn";
import type { ShoppingView } from "../shopping-view";
import { CopyListButton } from "./copy-list-button";

interface ShoppingProgressProps {
  totals: ShoppingView["totals"];
  getListText: () => string;
  className?: string;
}

/** Lo que se mira mientras se compra: cuánto falta y cuánto va. */
export function ShoppingProgress({ totals, getListText, className }: ShoppingProgressProps) {
  return (
    <section
      aria-label="Avance"
      className={cn("flex flex-col gap-3 rounded-md border border-hairline p-4", className)}
    >
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-muted">Falta por comprar</dt>
          <dd className="font-display text-xl font-semibold tabular-nums">{formatCop(totals.pendingCop)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Comprado</dt>
          <dd className="font-display text-xl font-semibold tabular-nums">
            {totals.done} de {totals.total}
          </dd>
        </div>
      </dl>
      <span className="h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden>
        <span
          className="block h-full origin-left rounded-full bg-cilantro transition-transform duration-(--dur-slow) ease-out"
          style={{ transform: `scaleX(${totals.total ? totals.done / totals.total : 0})` }}
        />
      </span>
      <div className="flex flex-wrap gap-2">
        <CopyListButton getText={getListText} />
        <Link href="/presupuesto" className={buttonClasses({ variant: "ghost", size: "sm" })}>
          Editar precios
        </Link>
      </div>
    </section>
  );
}

export function InPantryList({ items }: { items: ShoppingItem[] }) {
  if (items.length === 0) return null;
  return (
    <details className="group rounded-md border border-hairline p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
        <Package className="size-4 text-cilantro" aria-hidden />
        Ya lo tienes en casa ({items.length})
      </summary>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm text-muted">
        {items.map((item) => (
          <li key={`${item.ingredientId}-${item.toBuy.unit}`}>
            {item.name} · {formatQuantity(item.needed)}
          </li>
        ))}
      </ul>
    </details>
  );
}
