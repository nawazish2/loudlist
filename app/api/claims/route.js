import { NextResponse } from "next/server";
import { AppStoreError, lookupApp } from "../../lib/appstore";
import { claimApp, getCurrentBidForApp } from "../../lib/db";
import { getSiteUrl, isDatabaseConfigured } from "../../lib/env";
import { isAllowedClaimOrigin } from "../../lib/origin";
import { limitClaim } from "../../lib/rate-limit";
import { claimRequestSchema } from "../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(body, options = {}) {
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" }, ...options });
}

function requestIdentity(request) {
  return request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

export async function POST(request) {
  try {
    if (!isDatabaseConfigured()) return response({ error: "The board is not open yet." }, { status: 503 });
    if (!isAllowedClaimOrigin(request, getSiteUrl())) {
      return response({ error: "That request did not come from this site." }, { status: 403 });
    }

    let raw;
    try {
      raw = await request.json();
    } catch {
      return response({ error: "Check the claim details and try again." }, { status: 400 });
    }

    const input = claimRequestSchema.safeParse(raw);
    if (!input.success) return response({ error: input.error.issues[0]?.message || "Check the claim details and try again." }, { status: 400 });
    if (input.data.company) return response({ error: "Unable to create this claim." }, { status: 400 });

    const rate = await limitClaim(requestIdentity(request));
    if (!rate.success) {
      const status = rate.reset ? 429 : 503;
      return response({ error: status === 429 ? "Easy — that is a lot of noise at once. Try again shortly." : "The board is catching its breath." }, { status });
    }

    let app;
    try {
      app = await lookupApp(input.data.appStoreUrl);
    } catch (error) {
      if (error instanceof AppStoreError) return response({ error: error.message }, { status: 400 });
      throw error;
    }

    const claim = await claimApp({ id: crypto.randomUUID(), ...app, pitch: input.data.pitch, amountCents: input.data.amountCents });

    if (!claim) {
      const currentCents = await getCurrentBidForApp(app.appId);
      const needed = currentCents === null ? null : Math.round(currentCents / 100) + 1;
      return response({
        error: needed
          ? `${app.name} is already on the board at $${Math.round(currentCents / 100)}. You need $${needed} to take it.`
          : `${app.name} is already on the board at a louder number.`,
      }, { status: 409 });
    }

    return response({ claim });
  } catch (error) {
    console.error("Unable to create LoudList claim", error);
    return response({ error: "We could not get you on the board. Try again in a moment." }, { status: 502 });
  }
}
