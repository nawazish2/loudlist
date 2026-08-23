import { NextResponse } from "next/server";
import { createPendingClaim, attachCheckoutSession, cancelPendingClaim } from "../../lib/db";
import { getDodoClient } from "../../lib/dodo";
import { ConfigurationError, getDodoConfig, getSiteUrl } from "../../lib/env";
import { limitCheckout } from "../../lib/rate-limit";
import { checkoutRequestSchema } from "../../lib/validation";

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
  let claimId;
  try {
    const rate = await limitCheckout(requestIdentity(request));
    if (!rate.success) {
      const status = rate.reset ? 429 : 503;
      return response({ error: status === 429 ? "Too many checkout attempts. Try again in a minute." : "Checkout is temporarily unavailable." }, { status });
    }

    const input = checkoutRequestSchema.safeParse(await request.json());
    if (!input.success) return response({ error: input.error.issues[0]?.message || "Check the claim details and try again." }, { status: 400 });
    if (input.data.company) return response({ error: "Unable to create this checkout." }, { status: 400 });

    claimId = crypto.randomUUID();
    const pendingClaim = await createPendingClaim({ id: claimId, ...input.data });
    const { productId } = getDodoConfig();
    const checkout = await getDodoClient().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1, amount: pendingClaim.amountCents }],
      return_url: `${getSiteUrl()}/checkout/success?claim=${claimId}`,
      cancel_url: `${getSiteUrl()}/#how`,
      metadata: { claim_id: claimId, kind: "loudlist_rank" },
      customization: { theme: "light", force_language: "en" },
    });

    if (!checkout.checkout_url) throw new Error("Dodo did not return a checkout URL.");
    await attachCheckoutSession(claimId, checkout.session_id);
    return response({ checkoutUrl: checkout.checkout_url });
  } catch (error) {
    if (claimId) await cancelPendingClaim(claimId).catch(() => undefined);
    if (error instanceof ConfigurationError) return response({ error: "Checkout is not configured yet." }, { status: 503 });
    console.error("Unable to create LoudList checkout", error);
    return response({ error: "We could not start checkout. Your card was not charged." }, { status: 502 });
  }
}
