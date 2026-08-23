import "server-only";

import { recordClaimAttempt } from "./db";
import { isDatabaseConfigured } from "./env";

// Claiming is free now, so this is the only thing standing between the board and
// someone flooding it. A real person claims once and re-claims as their spot
// fades; five in ten minutes is far more than that and still stops a flood.
const WINDOW_SECONDS = 600;
const LIMIT = 5;

export async function limitClaim(identifier) {
  if (!isDatabaseConfigured()) return { success: false, reset: 0 };
  try {
    const { success } = await recordClaimAttempt(identifier, WINDOW_SECONDS, LIMIT);
    return { success, reset: WINDOW_SECONDS };
  } catch {
    return { success: false, reset: 0 };
  }
}
