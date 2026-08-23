import "server-only";

// Listings are identified by the App Store itself rather than by anything typed
// into the form. That keeps the board genuinely iOS-only, gives every listing a
// real name and icon, and means nobody can claim an app that does not exist.

const APP_STORE_HOSTS = new Set(["apps.apple.com", "itunes.apple.com"]);

export class AppStoreError extends Error {}

// https://apps.apple.com/us/app/bear-markdown-notes/id1016366447?uo=4 -> "1016366447"
export function extractAppId(value) {
  let parsed;
  try {
    parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    throw new AppStoreError("Paste an App Store link, like apps.apple.com/app/id123456789.");
  }
  if (!APP_STORE_HOSTS.has(parsed.hostname.replace(/^www\./, ""))) {
    throw new AppStoreError("That is not an App Store link. It should start with apps.apple.com.");
  }
  const match = parsed.pathname.match(/\/id(\d+)/);
  if (!match) throw new AppStoreError("That App Store link is missing its app id.");
  return match[1];
}

export async function lookupApp(appStoreUrl) {
  const appId = extractAppId(appStoreUrl);

  let payload;
  try {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${appId}&country=us`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Lookup responded ${response.status}`);
    payload = await response.json();
  } catch (error) {
    console.error("App Store lookup failed", { appId, error });
    throw new AppStoreError("We could not reach the App Store just now. Try again in a moment.");
  }

  const app = payload?.results?.[0];
  if (!app) throw new AppStoreError("We could not find that app on the App Store.");

  // `entity=software` does not exclude Mac apps, so the kind has to be checked
  // here or Mac-only titles would slip onto an iOS board.
  if (app.kind !== "software") {
    throw new AppStoreError("That is not an iOS app. This board is iPhone and iPad only.");
  }

  return {
    appId,
    name: app.trackName,
    developer: app.artistName,
    category: app.primaryGenreName || "Apps",
    // Drop Apple's ?uo=4 tracking parameter from the canonical link.
    url: (app.trackViewUrl || `https://apps.apple.com/us/app/id${appId}`).split("?")[0],
    iconUrl: app.artworkUrl512 || app.artworkUrl100 || null,
  };
}
