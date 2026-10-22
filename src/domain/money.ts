const COP_FORMAT = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCop(amountCop: number): string {
  return COP_FORMAT.format(Math.round(amountCop));
}
