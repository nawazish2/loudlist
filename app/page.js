"use client";

import { useEffect, useMemo, useState } from "react";
import { ALL_FILTER, seedEntries } from "./data";
import { ActivityFeed, ClaimCard, Hero, Leaderboard, Navigation, Ticker, Toast } from "./components";

function relativeTime(value) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "JUST NOW";
  if (minutes < 60) return `${minutes} MIN`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} HR`;
  return `${Math.floor(hours / 24)} D`;
}

export default function HomePage() {
  const [entries, setEntries] = useState(seedEntries);
  const [filter, setFilter] = useState(ALL_FILTER);
  const [selectedBid, setSelectedBid] = useState(0);
  const [notice, setNotice] = useState(null);
  const [boardState, setBoardState] = useState("preview");
  const [minimumBid, setMinimumBid] = useState(1);
  const [claimInFlight, setClaimInFlight] = useState(false);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(null), 5200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    let mounted = true;
    async function refreshBoard() {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!response.ok) throw new Error("Board unavailable");
        const payload = await response.json();
        if (!mounted) return;
        setMinimumBid(Number(payload.minimumBidCents) / 100 || 1);
        if (payload.configured) {
          setEntries(payload.entries || []);
          setBoardState("live");
        }
      } catch {
        if (!mounted) return;
        // Never leave sample listings on screen pretending to be real ranks.
        setEntries([]);
        setBoardState("error");
      }
    }
    refreshBoard();
    const interval = window.setInterval(refreshBoard, 15_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const activity = useMemo(() => {
    return entries
      .filter((entry) => entry.claimedAt)
      .slice()
      .sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt))
      .slice(0, 5)
      .map((entry) => ({
        id: entry.id,
        time: relativeTime(entry.claimedAt),
        subject: entry.name,
        copy: ` shouted $${Math.round(entry.claimedBid).toLocaleString()} to get on the board.`,
        rank: `#${entry.rank}`,
        up: entry.rank <= 3,
      }));
  }, [entries]);

  function handleChallenge(entry) {
    const nextBid = Math.max(Math.round(entry.bid) + 1, minimumBid);
    setSelectedBid(nextBid);
    setNotice({ title: "That spot has a number.", message: `$${nextBid} takes the spot ${entry.name} is holding and pushes it down one.` });
    document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleClaim(claim) {
    setClaimInFlight(true);
    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claim),
      });
      const payload = await response.json();
      if (!response.ok || !payload.claim) throw new Error(payload.error || "Unable to claim a spot.");
      window.location.assign(`/claimed?claim=${payload.claim.id}`);
    } catch (error) {
      setNotice({ title: "That did not land.", message: error.message || "Nothing was claimed. Try again in a moment." });
    } finally {
      setClaimInFlight(false);
    }
  }

  return (
    <>
      <Ticker />
      <div className="shell">
        <Navigation claimCount={entries.length} />
        <main id="top">
          <Hero />
          <ClaimCard onClaim={handleClaim} selectedBid={selectedBid} minimumBid={minimumBid} isProcessing={claimInFlight} entries={entries} />
          <Leaderboard entries={entries} filter={filter} onFilter={setFilter} onChallenge={handleChallenge} boardState={boardState} />
          <ActivityFeed activity={activity} />
        </main>
      </div>
      <footer>
        <div className="shell footer-inner">
          <div className="footer-line">Quiet is a choice.<br /><em>Take the mic.</em></div>
          <div className="footer-links"><a href="/terms">Board rules</a><a href="/privacy">Privacy</a><a href="#top">↑ Back up</a></div>
        </div>
      </footer>
      <Toast notice={notice} onClose={() => setNotice(null)} />
    </>
  );
}
