import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { WompiTransaction } from "@/lib/wompi/client";

export interface AppliedPayment {
  status: string;
  plan: string | null;
  expiresAt: string | null;
}

/** Las referencias de Olla; cualquier otra transacción del comercio no es nuestra. */
export const isOllaReference = (reference: string) => reference.startsWith("olla-");

/**
 * Lleva a la base lo que dijo Wompi sobre una transacción. La base activa el plan solo si quedó
 * aprobada por el monto exacto, y lo hace una vez aunque llegue dos veces (aviso y regreso).
 */
export async function applyTransaction(transaction: WompiTransaction): Promise<AppliedPayment | null> {
  const admin = createSupabaseAdminClient();
  if (!admin || !isOllaReference(transaction.reference)) return null;
  const { data, error } = await admin.rpc("apply_payment", {
    target_reference: transaction.reference,
    transaction_id: transaction.id,
    transaction_status: transaction.status,
    paid_amount_in_cents: transaction.amountInCents,
    paid_currency: transaction.currency,
    method_type: transaction.paymentMethodType ?? "",
  });
  if (error) {
    console.error("[pagos] no se pudo aplicar", transaction.reference, error.message);
    return null;
  }
  const [row] = data ?? [];
  return row ? { status: row.status, plan: row.plan, expiresAt: row.expires_at } : null;
}
