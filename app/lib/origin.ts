export function normalizeOrigin(value: string): string {
  return String(value || "").replace(/\/$/, "");
}

function allowedOrigins(
  request: { url: string },
  siteUrl: string,
): Set<string> {
  const requestOrigin = new URL(request.url).origin;
  return new Set([normalizeOrigin(siteUrl), normalizeOrigin(requestOrigin)]);
}

export function isAllowedClaimOrigin(
  request: { headers: { get(name: string): string | null }; url: string },
  siteUrl: string,
): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") return false;

  const allowed = allowedOrigins(request, siteUrl);
  const origin = request.headers.get("origin");
  if (origin) return allowed.has(normalizeOrigin(origin));

  const referer = request.headers.get("referer");
  if (!referer) return false;

  try {
    return allowed.has(normalizeOrigin(new URL(referer).origin));
  } catch {
    return false;
  }
}
