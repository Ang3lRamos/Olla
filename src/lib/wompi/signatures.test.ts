import { describe, expect, it } from "vitest";
import { integritySignature, isValidEvent, type WompiEvent } from "./signatures";

// Ejemplos tomados de la documentación de Wompi (docs.wompi.co).
describe("integritySignature", () => {
  it("coincide con el ejemplo de la documentación", () => {
    expect(
      integritySignature(
        "sk8-438k4-xmxm392-sn2m",
        2490000,
        "COP",
        "prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6",
      ),
    ).toBe("37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5");
  });
});

describe("isValidEvent", () => {
  const secret = "prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z";
  const event: WompiEvent = {
    event: "transaction.updated",
    data: { transaction: { id: "1234-1610641025-49201", status: "APPROVED", amount_in_cents: 4490000 } },
    timestamp: 1530291411,
    signature: {
      properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
      // sha256 de la cadena del ejemplo de la documentación. El checksum que la documentación
      // muestra al lado es ilustrativo: no corresponde a esa cadena.
      checksum: "5A18EC5E8FDB7DF463E9F94774CBA8F583BA21BD04A09CEFF2EA68A4BC0AEFBE",
    },
  };

  it("acepta el aviso firmado según la fórmula, en mayúsculas o minúsculas", () => {
    expect(isValidEvent(event, secret)).toBe(true);
    const lower = {
      ...event,
      signature: { ...event.signature, checksum: event.signature.checksum.toLowerCase() },
    };
    expect(isValidEvent(lower, secret)).toBe(true);
  });

  it("rechaza un aviso alterado o firmado con otro secreto", () => {
    const tampered = {
      ...event,
      data: { transaction: { ...(event.data.transaction as object), status: "DECLINED" } },
    };
    expect(isValidEvent(tampered, secret)).toBe(false);
    expect(isValidEvent(event, "otro")).toBe(false);
    expect(isValidEvent({ ...event, signature: { ...event.signature, checksum: "abc" } }, secret)).toBe(
      false,
    );
  });
});
