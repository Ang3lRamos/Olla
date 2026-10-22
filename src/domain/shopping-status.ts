import type { ShoppingLine } from "./shopping-list";
import type { BaseQuantity } from "./types";
import { formatQuantity } from "./units";

export interface Purchase {
  ingredientId: string;
  /** Misma unidad base que la línea del mercado a la que corresponde. */
  quantity: BaseQuantity;
}

/**
 * - pending: falta comprarlo.
 * - bought: ya se compró lo necesario.
 * - needs-more: se compró, pero el menú cambió y ahora hace falta más.
 * - in-pantry: la despensa lo cubre; no hay que comprarlo.
 */
export type ShoppingStatus = "pending" | "bought" | "needs-more" | "in-pantry";

export interface ShoppingItem extends ShoppingLine {
  status: ShoppingStatus;
  purchased: number;
  /** Lo que todavía hay que comprar. */
  remaining: BaseQuantity;
}

const keyOf = (ingredientId: string, unit: string) => `${ingredientId}|${unit}`;

export function reconcilePurchases(lines: ShoppingLine[], purchases: Purchase[]): ShoppingItem[] {
  const purchased = new Map(
    purchases.map((item) => [keyOf(item.ingredientId, item.quantity.unit), item.quantity.amount]),
  );

  return lines.map((line) => {
    const bought = purchased.get(keyOf(line.ingredientId, line.toBuy.unit)) ?? 0;
    const remaining = Math.max(Math.ceil(line.toBuy.amount - bought - 1e-9), 0);
    const status: ShoppingStatus =
      line.toBuy.amount === 0
        ? "in-pantry"
        : bought === 0
          ? "pending"
          : remaining === 0
            ? "bought"
            : "needs-more";
    return { ...line, status, purchased: bought, remaining: { amount: remaining, unit: line.toBuy.unit } };
  });
}

export interface TextListGroup {
  label: string;
  /** `detail` reemplaza la cantidad cuando se compra por paquetes ("1 paquete"). */
  items: Array<{ name: string; quantity: BaseQuantity | null; detail?: string | null }>;
}

/** Lista en texto plano para mandar por WhatsApp; solo incluye lo que falta comprar. */
export function formatShoppingText(title: string, groups: TextListGroup[]): string {
  const sections = groups
    .filter((group) => group.items.length > 0)
    .map((group) => {
      const lines = group.items.map((item) => {
        const amount = item.detail ?? (item.quantity && formatQuantity(item.quantity));
        return amount ? `- ${item.name}: ${amount}` : `- ${item.name}`;
      });
      return [group.label.toLocaleUpperCase("es"), ...lines].join("\n");
    });
  return sections.length ? [title, ...sections].join("\n\n") : `${title}\n\nNo falta nada por comprar.`;
}
