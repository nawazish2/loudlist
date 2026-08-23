import "server-only";

import { recordCheckoutAttempt } from "./db";
import { isDatabaseConfigured } from "./env";

const WINDOW_SECONDS = 60;
const LIMIT = 5;

export async function limitCheckout(identifier) {
  if (!isDatabaseConfigured()) return { success: false, reset: 0 };
  try {
    const { success } = await recordCheckoutAttempt(identifier, WINDOW_SECONDS, LIMIT);
    return { success, reset: WINDOW_SECONDS };
  } catch {
    return { success: false, reset: 0 };
  }
}
