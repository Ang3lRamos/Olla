import { createHash, timingSafeEqual } from "node:crypto";

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

/**
 * Firma de integridad del checkout: Wompi rechaza el pago si la referencia o el monto se
 * cambiaron en el navegador. sha256(referencia + monto en centavos + moneda + secreto).
 */
export function integritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  secret: string,
) {
  return sha256(`${reference}${amountInCents}${currency}${secret}`);
}

export interface WompiEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
  signature: { properties: string[]; checksum: string };
}

/** Lee "transaction.status" dentro de data, como pide la firma del evento. */
function valueAt(data: Record<string, unknown>, path: string): string {
  const value = path
    .split(".")
    .reduce<unknown>(
      (current, key) =>
        current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined,
      data,
    );
  return value === undefined || value === null ? "" : String(value);
}

/**
 * Comprueba que un aviso venga de Wompi: sha256 de los valores de signature.properties (en su
 * orden), más el timestamp, más el secreto de eventos. Las propiedades cambian por evento, así
 * que se leen del propio aviso.
 */
export function isValidEvent(event: WompiEvent, secret: string): boolean {
  const values = event.signature.properties.map((path) => valueAt(event.data, path)).join("");
  const expected = Buffer.from(sha256(`${values}${event.timestamp}${secret}`), "hex");
  const received = Buffer.from(event.signature.checksum.toLowerCase(), "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
