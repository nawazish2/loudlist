import { timingSafeEqual, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { listAllClaims, listReports, setClaimHidden } from "../../../lib/db";
import { ConfigurationError, getAdminToken } from "../../../lib/env";
import { claimIdSchema } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenDigest(value) {
  return createHash("sha256").update(value).digest();
}

function isAuthorized(request) {
  const presented = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const expected = getAdminToken();
  return timingSafeEqual(tokenDigest(presented), tokenDigest(expected));
}

function guard(request) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  } catch (error) {
    if (error instanceof ConfigurationError) return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
    throw error;
  }
  return null;
}

export async function GET(request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const [claims, reports] = await Promise.all([listAllClaims(), listReports()]);
    return NextResponse.json({ claims, reports }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to list LoudList claims", error);
    return NextResponse.json({ error: "Unable to read claims right now." }, { status: 503 });
  }
}

export async function PATCH(request) {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    const claimId = claimIdSchema.safeParse(body.claimId);
    if (!claimId.success) return NextResponse.json({ error: "Invalid claim id." }, { status: 400 });
    if (typeof body.hidden !== "boolean") return NextResponse.json({ error: "hidden must be a boolean." }, { status: 400 });

    const result = await setClaimHidden(claimId.data, body.hidden);
    if (result.conflict) {
      return NextResponse.json({ error: "That app is already listed. Hide the live listing first." }, { status: 409 });
    }
    if (!result.updated) return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    return NextResponse.json({ claimId: claimId.data, hidden: body.hidden });
  } catch (error) {
    console.error("Unable to update LoudList claim", error);
    return NextResponse.json({ error: "Unable to update that claim right now." }, { status: 503 });
  }
}
