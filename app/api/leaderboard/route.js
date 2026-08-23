import { NextResponse } from "next/server";
import { getLeaderboard, getMinimumBidCents } from "../../lib/db";
import { getRequiredBidFloor, isDatabaseConfigured } from "../../lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ entries: [], minimumBidCents: getRequiredBidFloor(), configured: false }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const [entries, minimumBidCents] = await Promise.all([getLeaderboard(), getMinimumBidCents()]);
    return NextResponse.json({ entries, minimumBidCents, configured: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to read LoudList leaderboard", error);
    return NextResponse.json({ error: "The board is taking a breather." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
