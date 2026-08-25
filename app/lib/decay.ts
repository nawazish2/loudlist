import { DECAY_HALF_LIFE_SECONDS } from "./constants";

export function decayedCents(
  amountCents: number,
  claimedAt: number | string | Date,
  now = Date.now(),
  halfLifeSeconds = DECAY_HALF_LIFE_SECONDS,
): number {
  const claimedAtMs = typeof claimedAt === "number" ? claimedAt : new Date(claimedAt).getTime();
  return amountCents * 0.5 ** (Math.max(0, (now - claimedAtMs) / 1000) / halfLifeSeconds);
}

export function beatsCurrent(
  nextCents: number,
  currentAmountCents: number,
  claimedAt: number | string | Date,
  now = Date.now(),
): boolean {
  return nextCents > decayedCents(currentAmountCents, claimedAt, now);
}
