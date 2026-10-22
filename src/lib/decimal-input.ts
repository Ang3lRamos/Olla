/** Acepta "1,5" y "1.5": en Colombia se escribe con coma decimal. */
export function parseDecimal(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string" || raw.trim() === "") return Number.NaN;
  return Number(raw.trim().replace(",", "."));
}

/** 1.5 -> "1,5", para mostrar en un campo lo que se guardó. */
export function formatDecimalInput(value: number): string {
  return String(value).replace(".", ",");
}
