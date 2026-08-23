"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function ClaimResult() {
  const claimId = useSearchParams().get("claim");
  const [claim, setClaim] = useState(null);
  const [state, setState] = useState("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!claimId) {
      setState("missing");
      return undefined;
    }

    let mounted = true;
    (async () => {
      try {
        const response = await fetch(`/api/claims/status?claim=${encodeURIComponent(claimId)}`, { cache: "no-store" });
        if (!mounted) return;
        if (!response.ok) {
          setState("missing");
          return;
        }
        const payload = await response.json();
        if (!mounted) return;
        if (!payload.claim) {
          setState("missing");
          return;
        }
        setClaim(payload.claim);
        setState(payload.claim.hidden ? "hidden" : "live");
      } catch {
        if (mounted) setState("error");
      }
    })();

    return () => {
      mounted = false;
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

      {state === "loading" && (
        <div className="receipt">
          <span className="mini">Receipt</span>
          <h1>Counting<br />your noise.</h1>
          <div className="receipt-wait"><span className="pulse" />Reading the board…</div>
        </div>
      )}

      {state === "live" && (
        <div className="receipt paid">
          <span className="mini">You are on the board</span>
          <div className="receipt-rank">#{claim.rank}</div>
          <h1>You are<br />on the board.</h1>
          <div className="receipt-rows">
            <div className="receipt-row"><span>Listing</span><b>{claim.name}</b></div>
            <div className="receipt-row"><span>Pitch</span><b>{claim.pitch}</b></div>
            <div className="receipt-row"><span>Category</span><b>{claim.category}</b></div>
            <div className="receipt-row"><span>Claimed at</span><b>{money.format(claim.claimedBid)}</b></div>
            <div className="receipt-row"><span>To out-loud you</span><b>{money.format(Math.round(claim.bid) + 1)}</b></div>
          </div>
          <p className="receipt-copy">Your loudness halves every day. Come back and shout again to hold the spot.</p>
          <div className="receipt-actions">
            <button className="button" type="button" onClick={copyShare}>{copied ? "Copied ✓" : "Copy the brag"}</button>
            <a className="claim-mini" href="/#board">See the board</a>
          </div>
        </div>
      )}

      {state === "hidden" && (
        <div className="receipt">
          <span className="mini">Off the board</span>
          <h1>This one was<br />taken down.</h1>
          <p className="receipt-copy">A moderator removed this listing from the board. If you think that was a mistake, the board rules explain how it works.</p>
          <div className="receipt-actions"><a className="button" href="/terms">Board rules</a></div>
        </div>
      )}

      {state === "error" && (
        <div className="receipt">
          <span className="mini">Hmm</span>
          <h1>We could not<br />read the board.</h1>
          <p className="receipt-copy">Your claim is fine — we just could not load it this second. Try again in a moment.</p>
          <div className="receipt-actions"><a className="button" href={`/claimed?claim=${claimId}`}>Try again</a></div>
        </div>
      )}

      {state === "missing" && (
        <div className="receipt">
          <span className="mini">Nothing here</span>
          <h1>We cannot<br />find that claim.</h1>
          <p className="receipt-copy">This link is missing its claim reference, or the claim no longer exists.</p>
          <div className="receipt-actions"><a className="button" href="/#board">See the board</a></div>
        </div>
      )}
    </div>
  );
}
