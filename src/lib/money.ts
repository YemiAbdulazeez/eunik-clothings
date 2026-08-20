/** Display kobo integers as Nigerian Naira. */
export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}
