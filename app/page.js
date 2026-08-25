import { getLeaderboard, getRecentEvents } from "./lib/db";
import { getMaximumBid, getRequiredBidFloor, isDatabaseConfigured } from "./lib/env";
import { seedEntries } from "./data";
import HomePage from "./home";

export const dynamic = "force-dynamic";

export default async function Page() {
  const minimumBid = getRequiredBidFloor() / 100;
  const maximumBid = getMaximumBid() / 100;

  if (!isDatabaseConfigured()) {
    return <HomePage initialEntries={seedEntries} initialEvents={[]} boardState="preview" minimumBid={minimumBid} maximumBid={maximumBid} />;
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

  return <HomePage initialEntries={entries} initialEvents={events} boardState={boardState} minimumBid={minimumBid} maximumBid={maximumBid} />;
}
