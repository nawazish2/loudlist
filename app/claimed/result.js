"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { dollarsToBeat, formatLoudness, money } from "../lib/money";

export default function ClaimResult() {
  const claimId = useSearchParams().get("claim");
  const [claim, setClaim] = useState(null);
  const [state, setState] = useState(claimId ? "loading" : "missing");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!claimId) return undefined;

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
    ? `I just took #${claim.rank} on the LOUDLIST app board with ${claim.name}. Come take it from me.`
    : "I just claimed a spot on the LOUDLIST app board.";

  async function copyShare() {
    const boardUrl = `${window.location.origin}/#board`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "LOUDLIST", text: shareText, url: boardUrl });
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2600);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${boardUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setCopied(false);
    }
  }

  const reclaimHref = claim?.url ? `/?reclaim=${encodeURIComponent(claim.url)}#how` : "/#how";

  return (
    <div className="receipt-shell">
      <Link className="brand receipt-brand" href="/"><span className="brand-burst">!</span>LOUDLIST</Link>

      {state === "loading" && (
        <div className="receipt">
          <span className="mini">Receipt</span>
          <h1>Counting<br />your noise.</h1>
          <div className="receipt-wait"><span className="pulse" />Reading the board…</div>
        </div>
      )}

      {state === "live" && (
        <div className="receipt paid">
          <span className="mini">Screenshot this · You are on the board</span>
          <div className="receipt-rank">#{claim.rank}</div>
          <div className="receipt-app">
            {claim.iconUrl ? <Image className="app-icon" src={claim.iconUrl} alt="" width={52} height={52} /> : null}
            <div>
              <h1>{claim.name}</h1>
              <p className="receipt-developer">{claim.developer}</p>
            </div>
          </div>
          <div className="receipt-rows">
            <div className="receipt-row"><span>Pitch</span><b>{claim.pitch}</b></div>
            <div className="receipt-row"><span>Category</span><b>{claim.category}</b></div>
            <div className="receipt-row"><span>Claimed at</span><b>{money.format(claim.claimedBid)}</b></div>
            <div className="receipt-row"><span>Loudness now</span><b>{formatLoudness(claim.bid)}</b></div>
            <div className="receipt-row"><span>To out-loud you</span><b>{money.format(dollarsToBeat(claim.bid))}</b></div>
          </div>
          <p className="receipt-copy">Your loudness halves every day. Come back and shout again before this receipt is worth half of what you typed.</p>
          <div className="receipt-actions">
            <button className="button" type="button" onClick={copyShare}>{copied ? "Copied ✓" : "Share the brag"}</button>
            <Link className="claim-mini" href={reclaimHref}>Shout again before it fades</Link>
            <Link className="claim-mini" href="/#board">See the board</Link>
          </div>
        </div>
      )}

      {state === "hidden" && (
        <div className="receipt">
          <span className="mini">Off the board</span>
          <h1>This one was<br />taken down.</h1>
          <p className="receipt-copy">A moderator removed this listing from the board. If you think that was a mistake, the board rules explain how it works.</p>
          <div className="receipt-actions"><Link className="button" href="/terms">Board rules</Link></div>
        </div>
      )}

      {state === "error" && (
        <div className="receipt">
          <span className="mini">Hmm</span>
          <h1>We could not<br />read the board.</h1>
          <p className="receipt-copy">Your claim is fine — we just could not load it this second. Try again in a moment.</p>
          <div className="receipt-actions"><Link className="button" href={`/claimed?claim=${claimId}`}>Try again</Link></div>
        </div>
      )}

      {state === "missing" && (
        <div className="receipt">
          <span className="mini">Nothing here</span>
          <h1>We cannot<br />find that claim.</h1>
          <p className="receipt-copy">This link is missing its claim reference, or the claim no longer exists.</p>
          <div className="receipt-actions"><Link className="button" href="/#board">See the board</Link></div>
        </div>
      )}
    </div>
  );
}
