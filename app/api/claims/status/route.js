import { NextResponse } from "next/server";
import { getClaim } from "../../../lib/db";
import { claimIdSchema } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const claimId = claimIdSchema.safeParse(new URL(request.url).searchParams.get("claim"));
  if (!claimId.success) return NextResponse.json({ error: "Invalid claim." }, { status: 400 });
  try {
    const claim = await getClaim(claimId.data);
    if (!claim) return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    return NextResponse.json({ claim }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to read claim status", error);
    return NextResponse.json({ error: "Unable to check this claim yet." }, { status: 503 });
  }
}
