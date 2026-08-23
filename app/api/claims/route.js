import { NextResponse } from "next/server";
import { createClaim } from "../../lib/db";
import { isDatabaseConfigured } from "../../lib/env";
import { limitClaim } from "../../lib/rate-limit";
import { claimRequestSchema } from "../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(body, options = {}) {
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" }, ...options });
}

function requestIdentity(request) {
  // x-real-ip is set by the platform; the leftmost x-forwarded-for entry is the
  // conventionally spoofable position, so it is only the fallback.
  return request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

export async function POST(request) {
  try {
    if (!isDatabaseConfigured()) return response({ error: "The board is not open yet." }, { status: 503 });

    const rate = await limitClaim(requestIdentity(request));
    if (!rate.success) {
      const status = rate.reset ? 429 : 503;
      return response({ error: status === 429 ? "Easy — that is a lot of noise at once. Try again shortly." : "The board is catching its breath." }, { status });
    }

    const input = claimRequestSchema.safeParse(await request.json());
    if (!input.success) return response({ error: input.error.issues[0]?.message || "Check the claim details and try again." }, { status: 400 });
    if (input.data.company) return response({ error: "Unable to create this claim." }, { status: 400 });

    const { company, acceptedRules, ...claimInput } = input.data;
    const claim = await createClaim({ id: crypto.randomUUID(), ...claimInput });
    return response({ claim });
  } catch (error) {
    console.error("Unable to create LoudList claim", error);
    return response({ error: "We could not get you on the board. Try again in a moment." }, { status: 502 });
  }
}
