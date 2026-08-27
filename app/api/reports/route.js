import { NextResponse } from "next/server";
import { createReport } from "../../lib/db";
import { getSiteUrl, isDatabaseConfigured } from "../../lib/env";
import { notifyReport } from "../../lib/notify";
import { isAllowedClaimOrigin } from "../../lib/origin";
import { requestIdentity } from "../../lib/request-identity";
import { limitReport } from "../../lib/rate-limit";
import { reportRequestSchema } from "../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    if (!isDatabaseConfigured()) return NextResponse.json({ error: "The board is not open yet." }, { status: 503 });
    if (!isAllowedClaimOrigin(request, getSiteUrl())) {
      return NextResponse.json({ error: "That request did not come from this site." }, { status: 403 });
    }

    const input = reportRequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message || "Check the report and try again." }, { status: 400 });

    const rate = await limitReport(requestIdentity(request));
    if (!rate.success) {
      const status = rate.reset ? 429 : 503;
      return NextResponse.json({ error: status === 429 ? "That is enough reports for now." : "Unable to record this report right now." }, { status });
    }

    const report = await createReport({ id: crypto.randomUUID(), claimId: input.data.claimId, reason: input.data.reason });
    if (!report) return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    await notifyReport({ report, claim: { name: report.name } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to record LoudList report", error);
    return NextResponse.json({ error: "Unable to record this report right now." }, { status: 503 });
  }
}
