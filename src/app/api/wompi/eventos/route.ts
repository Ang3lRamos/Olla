import { NextResponse } from "next/server";
import { z } from "zod";
import { applyTransaction, isOllaReference } from "@/features/billing/apply-payment";
import { parseEventTransaction } from "@/lib/wompi/client";
import { readWompiConfig } from "@/lib/wompi/config";
import { isValidEvent } from "@/lib/wompi/signatures";

const eventSchema = z.object({
  event: z.string(),
  data: z.record(z.string(), z.unknown()),
  timestamp: z.number(),
  signature: z.object({ properties: z.array(z.string()), checksum: z.string() }),
});

/**
 * Avisos de Wompi (transaction.updated). Solo se cree lo que viene firmado con el secreto de
 * eventos; Wompi reintenta si no recibe 200, así que lo ajeno o repetido también responde 200.
 */
export async function POST(request: Request) {
  const config = readWompiConfig();
  if (!config) return NextResponse.json({ error: "Pagos no configurados" }, { status: 503 });

  const event = eventSchema.safeParse(await request.json().catch(() => null));
  if (!event.success || !isValidEvent(event.data, config.eventsSecret)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }
  if (event.data.event !== "transaction.updated") return NextResponse.json({ ok: true });

  const transaction = parseEventTransaction(event.data.data);
  if (transaction) {
    const applied = await applyTransaction(transaction);
    // Si la base no respondió, se pide a Wompi que vuelva a intentar más tarde.
    if (!applied && isOllaReference(transaction.reference)) {
      return NextResponse.json({ error: "No se pudo registrar" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
