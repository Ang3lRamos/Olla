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

/**
 * Cruza la lista con lo comprado. `lines` es la lista contra la despensa de antes de comprar
 * (lo que este mercado pide); `current`, contra la despensa de ahora. Con `current`, lo que
 * falta sale de lo que de verdad hay en casa: sirve para compras parciales y para mercar
 * en varios viajes, cuando lo del primero ya se cocinó.
 */
export function reconcilePurchases(
  lines: ShoppingLine[],
  purchases: Purchase[],
  current?: ShoppingLine[],
): ShoppingItem[] {
  const purchased = new Map(
    purchases.map((item) => [keyOf(item.ingredientId, item.quantity.unit), item.quantity.amount]),
  );
  const now = new Map(current?.map((line) => [keyOf(line.ingredientId, line.toBuy.unit), line.toBuy.amount]));

  return lines.map((line) => {
    const key = keyOf(line.ingredientId, line.toBuy.unit);
    const bought = purchased.get(key) ?? 0;
    const missing = current ? (now.get(key) ?? 0) : line.toBuy.amount - bought;
    const remaining = Math.max(Math.ceil(missing - 1e-9), 0);
    const status: ShoppingStatus =
      remaining === 0 ? (bought > 0 ? "bought" : "in-pantry") : bought === 0 ? "pending" : "needs-more";
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
