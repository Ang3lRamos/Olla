import { NextResponse } from "next/server";
import { z } from "zod";
import { applyTransaction, isOllaReference } from "@/features/billing/apply-payment";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseEventTransaction, type WompiTransaction } from "@/lib/wompi/client";
import { readWompiConfig } from "@/lib/wompi/config";
import { isValidEvent } from "@/lib/wompi/signatures";

const eventSchema = z.object({
  event: z.string(),
  data: z.record(z.string(), z.unknown()),
  timestamp: z.number(),
  signature: z.object({ properties: z.array(z.string()), checksum: z.string() }),
});

interface LogEntry {
  event: string | null;
  transaction: WompiTransaction | null;
  signatureValid: boolean;
  outcome: string;
}

/** Deja constancia de cada aviso; si la bitácora falla, el aviso se procesa igual. */
async function logEvent({ event, transaction, signatureValid, outcome }: LogEntry) {
  const { error } = (await createSupabaseAdminClient()
    ?.from("payment_events")
    .insert({
      event,
      reference: transaction?.reference ?? null,
      transaction_id: transaction?.id ?? null,
      status: transaction?.status ?? null,
      signature_valid: signatureValid,
      outcome,
    })) ?? { error: null };
  if (error) console.error("[pagos] no se pudo registrar el aviso", error.message);
}

/**
 * Avisos de Wompi (transaction.updated). Solo se cree lo que viene firmado con el secreto de
 * eventos; Wompi reintenta si no recibe 200, así que lo ajeno o repetido también responde 200.
 */
export async function POST(request: Request) {
  const config = readWompiConfig();
  if (!config) return NextResponse.json({ error: "Pagos no configurados" }, { status: 503 });

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  const transaction = parsed.success ? parseEventTransaction(parsed.data.data) : null;
  const eventName = parsed.success ? parsed.data.event : null;
  if (!parsed.success || !isValidEvent(parsed.data, config.eventsSecret)) {
    await logEvent({ event: eventName, transaction, signatureValid: false, outcome: "firma inválida" });
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }
  if (eventName !== "transaction.updated" || !transaction) {
    await logEvent({ event: eventName, transaction, signatureValid: true, outcome: "ignorado" });
    return NextResponse.json({ ok: true });
  }

  const applied = await applyTransaction(transaction);
  const ours = isOllaReference(transaction.reference);
  await logEvent({
    event: eventName,
    transaction,
    signatureValid: true,
    outcome: !ours ? "referencia ajena" : applied ? `aplicado: ${applied.status}` : "error al aplicar",
  });
  // Si la base no respondió, se pide a Wompi que vuelva a intentar más tarde.
  if (ours && !applied) return NextResponse.json({ error: "No se pudo registrar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
