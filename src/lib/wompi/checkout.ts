import { WOMPI_CHECKOUT_URL, type WompiConfig } from "./config";
import { integritySignature } from "./signatures";

interface CheckoutInput {
  reference: string;
  amountInCents: number;
  /** Adónde vuelve la persona; Wompi agrega ?id=<transacción>. */
  redirectUrl: string;
  email?: string;
}

/** Enlace al checkout de Wompi (tarjeta, PSE, Nequi, Bancolombia): Olla nunca ve datos de pago. */
export function buildCheckoutUrl(config: WompiConfig, input: CheckoutInput): string {
  const url = new URL(WOMPI_CHECKOUT_URL);
  url.searchParams.set("public-key", config.publicKey);
  url.searchParams.set("currency", "COP");
  url.searchParams.set("amount-in-cents", String(input.amountInCents));
  url.searchParams.set("reference", input.reference);
  url.searchParams.set(
    "signature:integrity",
    integritySignature(input.reference, input.amountInCents, "COP", config.integritySecret),
  );
  url.searchParams.set("redirect-url", input.redirectUrl);
  if (input.email) url.searchParams.set("customer-data:email", input.email);
  return url.toString();
}
