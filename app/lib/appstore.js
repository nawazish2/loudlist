import "server-only";

import { AppStoreError, parseAppStoreUrl } from "./appstore-url";

export { AppStoreError, extractAppId } from "./appstore-url";

async function lookupInCountry(appId, country) {
  const response = await fetch(`https://itunes.apple.com/lookup?id=${appId}&country=${country}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Lookup responded ${response.status}`);
  return response.json();
}

export async function lookupApp(appStoreUrl) {
  const { appId, country } = parseAppStoreUrl(appStoreUrl);

  let payload;
  try {
    payload = await lookupInCountry(appId, country);
    if (!payload?.results?.[0] && country !== "us") {
      payload = await lookupInCountry(appId, "us");
    }
  } catch (error) {
    console.error("App Store lookup failed", { appId, country, error });
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
    url: (app.trackViewUrl || `https://apps.apple.com/${country}/app/id${appId}`).split("?")[0],
    iconUrl: app.artworkUrl512 || app.artworkUrl100 || null,
  };
}
