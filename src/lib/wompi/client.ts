import { z } from "zod";
import type { WompiConfig } from "./config";

export const TRANSACTION_STATUSES = ["PENDING", "APPROVED", "DECLINED", "VOIDED", "ERROR"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

const transactionSchema = z
  .object({
    id: z.string(),
    status: z.enum(TRANSACTION_STATUSES),
    reference: z.string(),
    amount_in_cents: z.number(),
    currency: z.string(),
    payment_method_type: z.string().nullable().optional(),
  })
  .transform((row) => ({
    id: row.id,
    status: row.status,
    reference: row.reference,
    amountInCents: row.amount_in_cents,
    currency: row.currency,
    paymentMethodType: row.payment_method_type ?? null,
  }));

export type WompiTransaction = z.output<typeof transactionSchema>;

/** Lee una transacción del lado del servidor; Wompi solo la entrega con la llave privada. */
export async function getTransaction(
  config: WompiConfig,
  transactionId: string,
  doFetch: typeof fetch = fetch,
): Promise<WompiTransaction | null> {
  const response = await doFetch(`${config.apiUrl}/transactions/${encodeURIComponent(transactionId)}`, {
    headers: { Authorization: `Bearer ${config.privateKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;
  const body = z.object({ data: z.unknown() }).safeParse(await response.json().catch(() => null));
  const transaction = body.success ? transactionSchema.safeParse(body.data.data) : null;
  return transaction?.success ? transaction.data : null;
}

/** Lo que viene dentro de un aviso transaction.updated. */
export function parseEventTransaction(data: unknown): WompiTransaction | null {
  const parsed = z.object({ transaction: transactionSchema }).safeParse(data);
  return parsed.success ? parsed.data.transaction : null;
}
