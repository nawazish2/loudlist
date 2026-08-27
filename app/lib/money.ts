export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function centsToBeat(decayedCents: number): number {
  if (!Number.isFinite(decayedCents) || decayedCents <= 0) return 100;
  return Math.ceil((Math.floor(decayedCents) + 100) / 100) * 100;
}

export function dollarsToBeat(decayedDollars: number): number {
  return centsToBeat(decayedDollars * 100) / 100;
}

export function formatLoudness(decayedDollars: number): string {
  return money.format(Math.max(0, Math.floor(Number(decayedDollars) || 0)));
}
