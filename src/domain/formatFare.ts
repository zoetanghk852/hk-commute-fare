export function formatFare(amount: number): string {
  // toFixed(2) eliminates IEEE 754 floating-point artifacts;
  // parseFloat strips unnecessary trailing zeros (e.g. "12.50" → 12.5, "12.00" → 12).
  return `HK$${parseFloat(amount.toFixed(2))}`;
}
