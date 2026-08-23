import { NextResponse } from "next/server";
import { activateClaim, claimWebhook, getClaim, hideClaimByPaymentId, releaseWebhook } from "../../../lib/db";
import { getDodoClient } from "../../../lib/dodo";
import { claimIdSchema } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Money that has moved back out. A refund or a dispute we lost or accepted means
// the payment behind the rank is gone, so the listing leaves the board. Disputes
// that are merely opened are left alone — they can still be won.
const UNSEATING_EVENTS = new Set(["refund.succeeded", "dispute.lost", "dispute.accepted"]);

function webhookHeaders(request) {
  return {
    "webhook-id": request.headers.get("webhook-id") || "",
    "webhook-signature": request.headers.get("webhook-signature") || "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
  };
}

// What the customer was actually charged for the listing itself, excluding tax.
// This is the only number allowed to seat a rank.
function netAmountCents(payment) {
  const total = Number(payment?.total_amount);
  const tax = Number(payment?.tax ?? 0);
  if (!Number.isFinite(total) || !Number.isFinite(tax)) return null;
  return total - tax;
}

async function handleEvent(event, webhookId) {
  if (event.type === "payment.succeeded") {
    const claimId = claimIdSchema.safeParse(event.data?.metadata?.claim_id);
    if (!claimId.success) return { received: true, ignored: true };

    const claim = await getClaim(claimId.data);
    if (!claim) return { received: true, ignored: true };

    // Never trust the amount we stored at checkout time. Dodo silently ignores the
    // per-session amount unless the product has pay-what-you-want enabled, in which
    // case everyone is charged the product's fixed price while bidding any number
    // they like. Verifying against the settled payment is what keeps rank honest.
    const paidCents = netAmountCents(event.data);
    if (paidCents !== claim.amountCents) {
      console.error("Refusing to activate claim: paid amount does not match the bid.", {
        claimId: claimId.data,
        bidCents: claim.amountCents,
        paidCents,
        currency: event.data?.currency,
        paymentId: event.data?.payment_id,
      });
      return { received: true, activated: false, reason: "amount_mismatch" };
    }

    const result = await activateClaim({ claimId: claimId.data, paymentId: event.data.payment_id });
    return { received: true, activated: result.activated };
  }

  if (UNSEATING_EVENTS.has(event.type)) {
    const paymentId = event.data?.payment_id;
    if (!paymentId) return { received: true, ignored: true };

    const unseatedClaimId = await hideClaimByPaymentId(paymentId);
    if (unseatedClaimId) {
      console.warn("Removed a listing from the board after money moved back.", {
        claimId: unseatedClaimId,
        paymentId,
        eventType: event.type,
        webhookId,
      });
    }
    return { received: true, unseated: Boolean(unseatedClaimId) };
  }

  return { received: true, ignored: true };
}

export async function POST(request) {
  const headers = webhookHeaders(request);
  const webhookId = headers["webhook-id"];
  if (!webhookId || !headers["webhook-signature"] || !headers["webhook-timestamp"]) {
    return NextResponse.json({ error: "Missing webhook signature headers." }, { status: 401 });
  }

  let event;
  try {
    event = getDodoClient().webhooks.unwrap(await request.text(), { headers });
  } catch (error) {
    console.error("Rejected invalid Dodo webhook", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let claimed = false;
  try {
    // Claim the delivery before acting on it, so a retry that overlaps the original
    // cannot apply the same event twice.
    claimed = await claimWebhook(webhookId, event.type);
    if (!claimed) return NextResponse.json({ received: true, duplicate: true });

    return NextResponse.json(await handleEvent(event, webhookId));
  } catch (error) {
    // Hand the id back so Dodo's retry is processed rather than skipped as a duplicate.
    if (claimed) await releaseWebhook(webhookId).catch(() => undefined);
    console.error("Unable to process Dodo webhook", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
