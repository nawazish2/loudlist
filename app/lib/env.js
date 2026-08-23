import "server-only";

export class ConfigurationError extends Error {}

function value(name) {
  return process.env[name]?.trim();
}

export function isDatabaseConfigured() {
  return Boolean(value("DATABASE_URL"));
}

export function getDatabaseUrl() {
  const databaseUrl = value("DATABASE_URL");
  if (!databaseUrl) throw new ConfigurationError("DATABASE_URL is not configured.");
  return databaseUrl;
}

export function isDodoConfigured() {
  return Boolean(value("DODO_PAYMENTS_API_KEY") && value("DODO_PAYMENTS_PRODUCT_ID") && value("DODO_PAYMENTS_WEBHOOK_KEY"));
}

export function getDodoConfig() {
  const apiKey = value("DODO_PAYMENTS_API_KEY");
  const productId = value("DODO_PAYMENTS_PRODUCT_ID");
  const webhookKey = value("DODO_PAYMENTS_WEBHOOK_KEY");
  const environment = value("DODO_PAYMENTS_ENVIRONMENT") || "test_mode";

  if (!apiKey || !productId || !webhookKey) {
    throw new ConfigurationError("Dodo Payments is not configured.");
  }

  if (environment !== "test_mode" && environment !== "live_mode") {
    throw new ConfigurationError("DODO_PAYMENTS_ENVIRONMENT must be test_mode or live_mode.");
  }

  return { apiKey, productId, webhookKey, environment };
}

export function getSiteUrl() {
  const configuredUrl = value("NEXT_PUBLIC_SITE_URL");
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function getRequiredBidFloor() {
  return 700;
}

export function getMaximumBid() {
  const configuredMaximum = Number(value("LOUDLIST_MAX_BID_CENTS") || 500000);
  return Number.isSafeInteger(configuredMaximum) && configuredMaximum >= getRequiredBidFloor() ? configuredMaximum : 500000;
}

export function getAdminToken() {
  const token = value("LOUDLIST_ADMIN_TOKEN");
  if (!token) throw new ConfigurationError("LOUDLIST_ADMIN_TOKEN is not configured.");
  return token;
}
