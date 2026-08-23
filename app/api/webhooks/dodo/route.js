import { NextResponse } from "next/server";
import { activateClaim, recordWebhook } from "../../../lib/db";
import { getDodoClient } from "../../../lib/dodo";
import { claimIdSchema } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function webhookHeaders(request) {
  return {
    "webhook-id": request.headers.get("webhook-id") || "",
    "webhook-signature": request.headers.get("webhook-signature") || "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
  };
}

export async function POST(request) {
  const headers = webhookHeaders(request);
  if (!headers["webhook-id"] || !headers["webhook-signature"] || !headers["webhook-timestamp"]) {
    return NextResponse.json({ error: "Missing webhook signature headers." }, { status: 401 });
  }

  let event;
  try {
    event = getDodoClient().webhooks.unwrap(await request.text(), { headers });
  } catch (error) {
    console.error("Rejected invalid Dodo webhook", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  try {
    if (event.type !== "payment.succeeded") {
      await recordWebhook(headers["webhook-id"], event.type);
      return NextResponse.json({ received: true, ignored: true });
    }

    const claimId = claimIdSchema.safeParse(event.data?.metadata?.claim_id);
    if (!claimId.success) {
      await recordWebhook(headers["webhook-id"], event.type);
      return NextResponse.json({ received: true, ignored: true });
    }

    const result = await activateClaim({ claimId: claimId.data, paymentId: event.data.payment_id });
    await recordWebhook(headers["webhook-id"], event.type);
    return NextResponse.json({ received: true, activated: result.activated });
  } catch (error) {
    console.error("Unable to process Dodo webhook", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
