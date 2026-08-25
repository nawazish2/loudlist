import "server-only";

import { BID_FLOOR_CENTS, DECAY_HALF_LIFE_SECONDS, getContactEmail, getMaximumBidCents, getPublicSiteUrl } from "./constants";

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
  return getPublicSiteUrl();
}

export function getRequiredBidFloor() {
  return BID_FLOOR_CENTS;
}

export function getDecayHalfLifeSeconds() {
  return DECAY_HALF_LIFE_SECONDS;
}

export function getMaximumBid() {
  return getMaximumBidCents();
}

export function getAdminToken() {
  const token = value("LOUDLIST_ADMIN_TOKEN");
  if (!token) throw new ConfigurationError("LOUDLIST_ADMIN_TOKEN is not configured.");
  return token;
}

export { getContactEmail };
