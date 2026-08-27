import { getLeaderboard, getRecentEvents } from "./lib/db";
import { getMaximumBid, getRequiredBidFloor, isDatabaseConfigured } from "./lib/env";
import { seedEntries } from "./data";
import HomePage from "./home";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const reclaimUrl = typeof params?.reclaim === "string" ? params.reclaim.slice(0, 2048) : "";
  const minimumBid = getRequiredBidFloor() / 100;
  const maximumBid = getMaximumBid() / 100;

  if (!isDatabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return <HomePage initialEntries={[]} initialEvents={[]} boardState="error" minimumBid={minimumBid} maximumBid={maximumBid} initialAppStoreUrl={reclaimUrl} />;
    }
    return <HomePage initialEntries={seedEntries} initialEvents={[]} boardState="preview" minimumBid={minimumBid} maximumBid={maximumBid} initialAppStoreUrl={reclaimUrl} />;
  }

  let entries = [];
  let events = [];
  let boardState = "error";
  try {
    [entries, events] = await Promise.all([getLeaderboard(), getRecentEvents()]);
    boardState = "live";
  } catch {
    entries = [];
    events = [];
    boardState = "error";
  }

  return <HomePage initialEntries={entries} initialEvents={events} boardState={boardState} minimumBid={minimumBid} maximumBid={maximumBid} initialAppStoreUrl={reclaimUrl} />;
}
