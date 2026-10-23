import "server-only";

/** Versión vigente de los términos y la política; se guarda con la aceptación de cada persona. */
export const LEGAL_VERSION = "2026-10-23";
export const LEGAL_UPDATED_AT = "23 de octubre de 2026";

export interface LegalOwner {
  name: string;
  id: string;
  city: string;
  address: string;
  phone: string;
  email: string;
}

const REQUIRED = {
  name: "LEGAL_OWNER_NAME",
  id: "LEGAL_OWNER_ID",
  address: "LEGAL_OWNER_ADDRESS",
  phone: "LEGAL_OWNER_PHONE",
  email: "LEGAL_CONTACT_EMAIL",
} as const;

/**
 * Quién responde por Olla. La Ley 1480 (art. 50) pide publicar identidad, dirección, teléfono y
 * correo; sin ellos los textos legales no serían válidos, así que faltar uno rompe el build.
 */
export function readLegalOwner(): LegalOwner {
  const missing = Object.values(REQUIRED).filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Faltan datos del responsable: ${missing.join(", ")}`);
  const value = (key: keyof typeof REQUIRED) => process.env[REQUIRED[key]]!.trim();
  return {
    name: value("name"),
    id: value("id"),
    city: "Medellín, Antioquia",
    address: value("address"),
    phone: value("phone"),
    email: value("email"),
  };
}
