import { z } from "zod";

export interface WompiConfig {
  publicKey: string;
  privateKey: string;
  eventsSecret: string;
  integritySecret: string;
  /** Sandbox o producción, según las llaves: las de prueba empiezan por pub_test_. */
  apiUrl: string;
  sandbox: boolean;
}

export const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/";
const SANDBOX_API_URL = "https://sandbox.wompi.co/v1";
const PRODUCTION_API_URL = "https://production.wompi.co/v1";

const configSchema = z.object({
  WOMPI_PUBLIC_KEY: z
    .string()
    .trim()
    .regex(/^pub_(test|prod)_/),
  WOMPI_PRIVATE_KEY: z
    .string()
    .trim()
    .regex(/^prv_(test|prod)_/),
  WOMPI_EVENTS_SECRET: z.string().trim().min(1),
  WOMPI_INTEGRITY_SECRET: z.string().trim().min(1),
});

/**
 * Lee las llaves de Wompi; null si faltan, para que la página de planes diga que los pagos no
 * están disponibles en vez de fallar. Mezclar llaves de prueba y de producción es un error.
 */
export function readWompiConfig(env: Record<string, string | undefined> = process.env): WompiConfig | null {
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) return null;
  const { WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET } = parsed.data;
  const sandbox = WOMPI_PUBLIC_KEY.startsWith("pub_test_");
  if (sandbox !== WOMPI_PRIVATE_KEY.startsWith("prv_test_")) {
    throw new Error("Las llaves de Wompi mezclan pruebas y producción.");
  }
  return {
    publicKey: WOMPI_PUBLIC_KEY,
    privateKey: WOMPI_PRIVATE_KEY,
    eventsSecret: WOMPI_EVENTS_SECRET,
    integritySecret: WOMPI_INTEGRITY_SECRET,
    apiUrl: sandbox ? SANDBOX_API_URL : PRODUCTION_API_URL,
    sandbox,
  };
}
