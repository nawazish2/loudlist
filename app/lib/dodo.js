import "server-only";

import DodoPayments from "dodopayments";
import { getDodoConfig } from "./env";

export function getDodoClient() {
  const config = getDodoConfig();
  return new DodoPayments({
    bearerToken: config.apiKey,
    webhookKey: config.webhookKey,
    environment: config.environment,
    timeout: 15_000,
    maxRetries: 1,
  });
}
