export class AppStoreError extends Error {}

const APP_STORE_HOSTS = new Set(["apps.apple.com", "itunes.apple.com"]);

export function parseAppStoreUrl(value: string): { appId: string; country: string } {
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    throw new AppStoreError("Paste an App Store link, like apps.apple.com/app/id123456789.");
  }
  if (!APP_STORE_HOSTS.has(parsed.hostname.replace(/^www\./, ""))) {
    throw new AppStoreError("That is not an App Store link. It should start with apps.apple.com.");
  }
  const match = parsed.pathname.match(/\/id(\d+)/);
  if (!match?.[1]) throw new AppStoreError("That App Store link is missing its app id.");
  const countryMatch = parsed.pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
  const country = countryMatch?.[1]?.toLowerCase() || "us";
  return { appId: match[1], country };
}

export function extractAppId(value: string): string {
  return parseAppStoreUrl(value).appId;
}
