import "server-only";

import { CLAIM_RATE_LIMIT, CLAIM_RATE_WINDOW_SECONDS, REPORT_RATE_LIMIT, REPORT_RATE_WINDOW_SECONDS } from "./constants";
import { recordClaimAttempt } from "./db";
import { isDatabaseConfigured } from "./env";

async function limit(identifier, windowSeconds, maxAttempts) {
  if (!isDatabaseConfigured()) return { success: false, reset: 0 };
  try {
    const { success } = await recordClaimAttempt(identifier, windowSeconds, maxAttempts);
    return { success, reset: windowSeconds };
  } catch {
    return { success: false, reset: 0 };
  }
}

export async function limitClaim(identifier) {
  return limit(`claim:${identifier}`, CLAIM_RATE_WINDOW_SECONDS, CLAIM_RATE_LIMIT);
}

export async function limitReport(identifier) {
  return limit(`report:${identifier}`, REPORT_RATE_WINDOW_SECONDS, REPORT_RATE_LIMIT);
}
