"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function ClaimResult() {
  const claimId = useSearchParams().get("claim");
  const [claim, setClaim] = useState(null);
  const [state, setState] = useState("confirming");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!claimId) {
      setState("missing");
      return undefined;
    }

    let mounted = true;
    let attempts = 0;
    let timeout;

    async function check() {
      attempts += 1;
      try {
        const response = await fetch(`/api/claims/status?claim=${encodeURIComponent(claimId)}`, { cache: "no-store" });
        if (response.status === 400 || response.status === 404) {
          if (mounted) setState("missing");
          return;
        }
        const payload = await response.json();
        if (!mounted) return;
        if (payload.claim) setClaim(payload.claim);
        if (payload.claim?.status === "paid") {
          setState("paid");
          return;
        }
        if (payload.claim?.status === "cancelled") {
          setState("cancelled");
          return;
        }
      } catch {
        // A failed poll is not an answer — keep waiting for the webhook.
      }
      if (!mounted) return;
      if (attempts >= 30) {
        setState("slow");
        return;
      }
      timeout = window.setTimeout(check, 2000);
    }

    check();
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [claimId]);

  const shareText = claim?.rank
    ? `I just took #${claim.rank} on the LOUDLIST board with ${claim.name}. Come take it from me.`
    : "I just claimed a spot on the LOUDLIST board.";

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(`${shareText} ${window.location.origin}/#board`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="receipt-shell">
      <a className="brand receipt-brand" href="/"><span className="brand-burst">!</span>LOUDLIST</a>

      {state === "confirming" && (
        <div className="receipt">
          <span className="mini">Receipt pending</span>
          <h1>Counting<br />your noise.</h1>
          <p className="receipt-copy">Your payment went through. We are waiting for the confirmation that moves you onto the board — it usually lands in a few seconds. Keep this page open.</p>
          <div className="receipt-wait"><span className="pulse" />Confirming with the payment provider…</div>
        </div>
      )}

      {state === "paid" && (
        <div className="receipt paid">
          <span className="mini">Receipt confirmed</span>
          <div className="receipt-rank">#{claim.rank}</div>
          <h1>You are<br />on the board.</h1>
          <div className="receipt-rows">
            <div className="receipt-row"><span>Listing</span><b>{claim.name}</b></div>
            <div className="receipt-row"><span>Pitch</span><b>{claim.pitch}</b></div>
            <div className="receipt-row"><span>Category</span><b>{claim.category}</b></div>
            <div className="receipt-row"><span>Claim</span><b>{money.format(claim.bid)}</b></div>
            <div className="receipt-row"><span>To out-loud you</span><b>{money.format(claim.bid + 1)}</b></div>
          </div>
          <div className="receipt-actions">
            <button className="button" type="button" onClick={copyShare}>{copied ? "Copied ✓" : "Copy the brag"}</button>
            <a className="claim-mini" href="/#board">See the board</a>
          </div>
        </div>
      )}

      {state === "slow" && (
        <div className="receipt">
          <span className="mini">Still landing</span>
          <h1>This one is<br />taking a minute.</h1>
          <p className="receipt-copy">Your payment is recorded and your spot is reserved — the confirmation just has not reached us yet. Nothing is lost. Refresh this page in a moment, or check the board directly.</p>
          <div className="receipt-actions">
            <a className="button" href={`/checkout/success?claim=${claimId}`}>Check again</a>
            <a className="claim-mini" href="/#board">See the board</a>
          </div>
        </div>
      )}

      {state === "cancelled" && (
        <div className="receipt">
          <span className="mini">No charge</span>
          <h1>That claim<br />was let go.</h1>
          <p className="receipt-copy">This claim was cancelled before it reached the board, so you were not charged. The spot is still up for grabs.</p>
          <div className="receipt-actions"><a className="button" href="/#how">Claim it again</a></div>
        </div>
      )}

      {state === "missing" && (
        <div className="receipt">
          <span className="mini">Nothing here</span>
          <h1>We cannot<br />find that claim.</h1>
          <p className="receipt-copy">This link is missing its claim reference, or the claim no longer exists. If you were charged, the board will still update on its own.</p>
          <div className="receipt-actions"><a className="button" href="/#board">See the board</a></div>
        </div>
      )}
    </div>
  );
}
