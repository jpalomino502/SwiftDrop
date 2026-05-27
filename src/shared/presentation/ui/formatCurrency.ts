export function formatCOP(amountCents: number, options: Intl.NumberFormatOptions = {}) {
  const amount = Number.isFinite(amountCents) ? amountCents : 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}
