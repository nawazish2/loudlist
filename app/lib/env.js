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

export function getSiteUrl() {
  const configuredUrl = value("NEXT_PUBLIC_SITE_URL");
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function getRequiredBidFloor() {
  return 100;
}

// A claim loses half its loudness every 24 hours. Nothing holds the top of the
// board by being early — only by coming back. This is what keeps the board
// moving now that claiming is free, so it is deliberately not configurable.
export function getDecayHalfLifeSeconds() {
  return 86400;
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
