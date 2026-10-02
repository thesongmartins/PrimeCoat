/**
 * Formats a Naira amount for display, e.g. 12500 -> "₦12,500", 12500.5 -> "₦12,500.50".
 * Amounts are stored as numeric(12,2) NGN in the database.
 */
export function formatNaira(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const hasKobo = Math.round(safe * 100) % 100 !== 0;
  const formatted = safe.toLocaleString("en-NG", {
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `₦${formatted}`;
}

/** Rounds to 2 decimal places, avoiding floating-point drift. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
