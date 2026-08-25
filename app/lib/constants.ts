export const BID_FLOOR_CENTS = 100;
export const DECAY_HALF_LIFE_SECONDS = 86400;
export const DEFAULT_MAX_BID_CENTS = 500000;
export const CLAIM_RATE_WINDOW_SECONDS = 600;
export const CLAIM_RATE_LIMIT = 5;
export const REPORT_RATE_WINDOW_SECONDS = 3600;
export const REPORT_RATE_LIMIT = 8;
export const DEFAULT_CONTACT_EMAIL = "hello@nawazish.site";

export function getMaximumBidCents(): number {
  const configuredMaximum = Number(process.env.LOUDLIST_MAX_BID_CENTS || DEFAULT_MAX_BID_CENTS);
  return Number.isSafeInteger(configuredMaximum) && configuredMaximum >= BID_FLOOR_CENTS
    ? configuredMaximum
    : DEFAULT_MAX_BID_CENTS;
}

export function getContactEmail(): string {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || DEFAULT_CONTACT_EMAIL;
}

export function getPublicSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return "http://localhost:3000";
}
