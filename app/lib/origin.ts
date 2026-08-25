export function normalizeOrigin(value: string): string {
  return String(value || "").replace(/\/$/, "");
}

export function isAllowedClaimOrigin(
  request: { headers: { get(name: string): string | null }; url: string },
  siteUrl: string,
): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return secFetchSite !== "cross-site";

  const requestOrigin = new URL(request.url).origin;
  const allowed = new Set([normalizeOrigin(siteUrl), normalizeOrigin(requestOrigin)]);
  return allowed.has(normalizeOrigin(origin));
}
