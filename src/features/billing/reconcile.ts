import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findTransactionsByReference } from "@/lib/wompi/client";
import { readWompiConfig } from "@/lib/wompi/config";
import { applyTransaction } from "./apply-payment";

/** Solo se revisan pagos recientes: uno de hace días sin respuesta ya no va a cambiar. */
const RECONCILE_WINDOW_HOURS = 48;

/**
 * Red de seguridad por si el aviso de Wompi no llegó y la persona cerró la pestaña: pregunta a
 * Wompi por los pagos pendientes del hogar y aplica lo que ya se resolvió.
 */
export async function reconcilePendingPayments(householdId: string): Promise<void> {
  const config = readWompiConfig();
  if (!config) return;
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - RECONCILE_WINDOW_HOURS * 3_600_000).toISOString();
  const { data } = await supabase
    .from("payments")
    .select("reference")
    .eq("household_id", householdId)
    .eq("status", "PENDING")
    .gte("created_at", since);

  for (const { reference } of data ?? []) {
    const [latest] = await findTransactionsByReference(config, reference);
    if (latest && latest.status !== "PENDING") await applyTransaction(latest);
  }
}
