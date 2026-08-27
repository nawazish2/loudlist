"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityFeed, ClaimCard, Hero, Leaderboard, Navigation, ReportModal, Ticker, Toast } from "./components";
import { ALL_FILTER } from "./data";
import { getContactEmail } from "./lib/constants";
import { dollarsToBeat } from "./lib/money";
import { relativeTime } from "./lib/relative-time";

export default function HomePage({ initialEntries, initialEvents, boardState: initialBoardState, minimumBid, maximumBid, initialAppStoreUrl = "" }) {
  const [entries, setEntries] = useState(initialEntries);
  const [events, setEvents] = useState(initialEvents);
  const [filter, setFilter] = useState(ALL_FILTER);
  const [selectedBid, setSelectedBid] = useState(0);
  const [notice, setNotice] = useState(
    initialAppStoreUrl
      ? { title: "Shout again.", message: "The App Store link is filled in. Pick a louder number before this listing fades." }
      : null,
  );
  const [boardState, setBoardState] = useState(initialBoardState);
  const [floor, setFloor] = useState(minimumBid);
  const [ceiling, setCeiling] = useState(maximumBid);
  const [claimInFlight, setClaimInFlight] = useState(false);
  const [reportEntry, setReportEntry] = useState(null);
  const [reportSending, setReportSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!initialAppStoreUrl) return undefined;
    document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return undefined;
  }, [initialAppStoreUrl]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(null), 5200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (initialBoardState === "preview") return undefined;

    let mounted = true;
    async function refreshBoard() {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!response.ok) throw new Error("Board unavailable");
        const payload = await response.json();
        if (!mounted) return;
        setFloor(Number(payload.minimumBidCents) / 100 || 1);
        setCeiling((current) => Number(payload.maximumBidCents) / 100 || current);
        if (payload.configured) {
          setEntries(payload.entries || []);
          setEvents(payload.events || []);
          setBoardState("live");
        }
      } catch {
        if (!mounted) return;
        setEntries([]);
        setEvents([]);
        setBoardState("error");
      }
    }

    refreshBoard();
    const interval = window.setInterval(refreshBoard, 15_000);
    document.addEventListener("visibilitychange", refreshBoard);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshBoard);
    };
  }, [initialBoardState]);

  const activity = useMemo(() => {
    const source = events.length
      ? events
      : entries.filter((entry) => entry.claimedAt).sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt)).slice(0, 5);
    return source.map((entry) => ({
      id: entry.id,
      time: relativeTime(entry.claimedAt),
      subject: entry.name,
      copy: ` shouted $${Math.round(entry.claimedBid).toLocaleString()} to get on the board.`,
      rank: entry.rank ? `#${entry.rank}` : "",
      up: Boolean(entry.rank && entry.rank <= 3),
    }));
  }, [entries, events]);

  function handleChallenge(entry) {
    const nextBid = Math.max(dollarsToBeat(entry.bid), floor);
    setSelectedBid(Math.min(nextBid, ceiling));
    setNotice({ title: "That spot has a number.", message: `$${nextBid} takes ${entry.name}'s spot — one whole dollar louder than it is right now.` });
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
      router.push(`/claimed?claim=${payload.claim.id}`);
    } catch (error) {
      setNotice({ title: "That did not land.", message: error.message || "Nothing was claimed. Try again in a moment." });
    } finally {
      setClaimInFlight(false);
    }
  }

  function openReport(entry) {
    setReportEntry(entry);
  }

  async function submitReport(reason) {
    if (!reportEntry || reportSending) return;
    setReportSending(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: reportEntry.id, reason }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to send that report.");
      setReportEntry(null);
      setNotice({ title: "Report in.", message: "A moderator will see this. Thanks for keeping the board honest." });
    } catch (error) {
      setNotice({ title: "Report did not send.", message: error.message || "Try again in a moment." });
    } finally {
      setReportSending(false);
    }
  }

  const contactEmail = getContactEmail();

  return (
    <>
      <Ticker boardState={boardState} />
      <div className="shell">
        <Navigation claimCount={entries.length} />
        <main id="top">
          <Hero />
          <ClaimCard onClaim={handleClaim} selectedBid={selectedBid} onBidEdit={() => setSelectedBid(0)} minimumBid={floor} maximumBid={ceiling} isProcessing={claimInFlight} entries={entries} initialAppStoreUrl={initialAppStoreUrl} />
          <Leaderboard entries={entries} filter={filter} onFilter={setFilter} onChallenge={handleChallenge} onReport={openReport} boardState={boardState} />
          <ActivityFeed activity={activity} />
        </main>
      </div>
      <footer>
        <div className="shell footer-inner">
          <div className="footer-line">Quiet is a choice.<br /><em>Take the mic.</em></div>
          <div className="footer-links">
            <a href="/terms">Board rules</a>
            <a href="/privacy">Privacy</a>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            <a href="#top">↑ Back up</a>
          </div>
        </div>
      </footer>
      <Toast notice={notice} onClose={() => setNotice(null)} />
      <ReportModal entry={reportEntry} onClose={() => setReportEntry(null)} onSubmit={submitReport} isSending={reportSending} />
    </>
  );
}
