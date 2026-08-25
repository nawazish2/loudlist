import { NextResponse } from "next/server";
import { getLeaderboard, getMinimumBidCents, getRecentEvents } from "../../lib/db";
import { getMaximumBid, getRequiredBidFloor, isDatabaseConfigured } from "../../lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cacheHeaders = { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=25" };

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      entries: [],
      events: [],
      minimumBidCents: getRequiredBidFloor(),
      maximumBidCents: getMaximumBid(),
      configured: false,
    }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const [entries, events, minimumBidCents] = await Promise.all([getLeaderboard(), getRecentEvents(), getMinimumBidCents()]);
    return NextResponse.json({
      entries,
      events,
      minimumBidCents,
      maximumBidCents: getMaximumBid(),
      configured: true,
    }, { headers: cacheHeaders });
  } catch (error) {
    console.error("Unable to read LoudList leaderboard", error);
    return NextResponse.json({ error: "The board is taking a breather." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
