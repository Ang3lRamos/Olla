import { describe, expect, it, vi } from "vitest";
import { buildCheckoutUrl } from "./checkout";
import { getTransaction } from "./client";
import { readWompiConfig, type WompiConfig } from "./config";
import { integritySignature } from "./signatures";

const config: WompiConfig = {
  publicKey: "pub_test_abc",
  privateKey: "prv_test_abc",
  eventsSecret: "test_events_x",
  integritySecret: "test_integrity_x",
  apiUrl: "https://sandbox.wompi.co/v1",
  sandbox: true,
};

describe("readWompiConfig", () => {
  const env = {
    WOMPI_PUBLIC_KEY: "pub_test_1",
    WOMPI_PRIVATE_KEY: "prv_test_1",
    WOMPI_EVENTS_SECRET: "test_events_1",
    WOMPI_INTEGRITY_SECRET: "test_integrity_1",
  };

  it("con llaves de prueba usa el sandbox", () => {
    expect(readWompiConfig(env)).toMatchObject({ sandbox: true, apiUrl: "https://sandbox.wompi.co/v1" });
  });

  it("sin llaves no hay pagos, y mezclar ambientes es un error", () => {
    expect(readWompiConfig({})).toBeNull();
    expect(() => readWompiConfig({ ...env, WOMPI_PRIVATE_KEY: "prv_prod_1" })).toThrow(/mezclan/);
  });
});

describe("buildCheckoutUrl", () => {
  it("firma referencia y monto y pide volver a Olla", () => {
    const url = new URL(
      buildCheckoutUrl(config, {
        reference: "olla-1",
        amountInCents: 1990000,
        redirectUrl: "https://olla.co/planes/resultado",
        email: "ana@ejemplo.com",
      }),
    );
    expect(url.origin + url.pathname).toBe("https://checkout.wompi.co/p/");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      "public-key": "pub_test_abc",
      currency: "COP",
      "amount-in-cents": "1990000",
      reference: "olla-1",
      "signature:integrity": integritySignature("olla-1", 1990000, "COP", "test_integrity_x"),
      "redirect-url": "https://olla.co/planes/resultado",
      "customer-data:email": "ana@ejemplo.com",
    });
  });
});

describe("getTransaction", () => {
  it("consulta con la llave privada y normaliza la respuesta", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: "t-1",
            status: "APPROVED",
            reference: "olla-1",
            amount_in_cents: 1990000,
            currency: "COP",
            payment_method_type: "PSE",
          },
        }),
      ),
    );
    expect(await getTransaction(config, "t-1", fetch)).toEqual({
      id: "t-1",
      status: "APPROVED",
      reference: "olla-1",
      amountInCents: 1990000,
      currency: "COP",
      paymentMethodType: "PSE",
    });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://sandbox.wompi.co/v1/transactions/t-1");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer prv_test_abc");
  });

  it("devuelve null si Wompi no la encuentra o responde algo raro", async () => {
    const notFound = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response("", { status: 404 }));
    expect(await getTransaction(config, "x", notFound)).toBeNull();
    const weird = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ data: {} })));
    expect(await getTransaction(config, "x", weird)).toBeNull();
  });
});
