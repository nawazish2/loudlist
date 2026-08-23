"use client";

import { useEffect, useState } from "react";
import { ALL_FILTER } from "./data";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function Ticker() {
  const messages = [
    <><b>● Live board</b> — the loudest apps on the App Store</>,
    <>Claim a slot. Turn heads. <b>Share the receipt.</b></>,
    <>Every claim <b>fades by half a day</b> — come back and shout again</>,
  ];

  return (
    <div className="ticker" aria-label="Live site updates">
      <div className="ticker-track">
        {[...messages, ...messages].map((message, index) => (
          <span className="ticker-item" key={index}>
            {message}<i aria-hidden="true">✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Navigation({ claimCount }) {
  return (
    <nav>
      <a className="brand" href="#top" aria-label="LoudList home"><span className="brand-burst">!</span>LOUDLIST</a>
      <div className="nav-links">
        <a href="#board">The board</a>
        <a href="#activity">The noise</a>
        <a href="#how">How it works</a>
      </div>
      <div className="live-pill"><span className="pulse" /><span>{claimCount.toLocaleString()}</span> ON THE BOARD</div>
    </nav>
  );
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div>
        <div className="eyebrow mini">The App Store&apos;s attention auction</div>
        <h1 id="hero-title">Your app<br />deserves a <span className="underline">louder</span><br />room.</h1>
        <p className="hero-copy">LoudList is a public wall of iPhone and iPad apps. No install counts, no editorial picks, no algorithm — just how loudly someone is willing to shout about the thing they built.</p>
        <div className="hero-foot">
          <svg className="arrow" viewBox="0 0 46 22" aria-hidden="true"><path d="M1 4c11-5 23 1 29 9M25 4l7 9-11 3" /></svg>
          <span className="scrawl">your future<br />bragging rights →</span>
        </div>
      </div>
      <aside className="manifesto">
        <span className="mini">The only metric</span>
        <p>Can people <strong>ignore</strong> you?</p>
        <small>NO ALGORITHM. NO SECRET SAUCE.<br />JUST A PUBLIC RECEIPT FOR AMBITION.</small>
      </aside>
    </section>
  );
}

export function ClaimCard({ onClaim, selectedBid, minimumBid, isProcessing, entries }) {
  const [form, setForm] = useState({ appStoreUrl: "", pitch: "", bid: 1, acceptedRules: false, company: "" });

  useEffect(() => {
    if (selectedBid) setForm((current) => ({ ...current, bid: selectedBid }));
  }, [selectedBid]);

  useEffect(() => {
    setForm((current) => current.bid < minimumBid ? { ...current, bid: minimumBid } : current);
  }, [minimumBid]);

  const bidDollars = Math.max(minimumBid, Number(form.bid) || minimumBid);
  const topBid = entries?.length ? Math.max(...entries.map((entry) => entry.bid)) : 0;
  const projectedRank = entries?.length ? entries.filter((entry) => entry.bid >= bidDollars).length + 1 : null;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.appStoreUrl.trim() || isProcessing) return;
    await onClaim({
      appStoreUrl: form.appStoreUrl.trim(),
      pitch: form.pitch.trim(),
      amountCents: Math.round(Math.max(minimumBid, Number(form.bid) || minimumBid) * 100),
      acceptedRules: form.acceptedRules,
      company: form.company,
    });
  }

  return (
    <section className="action-deck" id="how" aria-labelledby="claim-title">
      <div className="deck-title">
        <span className="mini">One board. One winner. Infinite receipts.</span>
        <h2>Put your<br />app where<br />the noise is.</h2>
        <div className="deck-stats">
          <div className="stat"><b>{entries?.length ?? 0}</b>apps on the board</div>
          <div className="stat"><b>{topBid ? money.format(topBid) : "—"}</b>loudest claim</div>
          <div className="stat"><b>{money.format(minimumBid)}</b>cheapest way in</div>
        </div>
      </div>
      <form className="claim" onSubmit={submit}>
        <div className="claim-header">
          <h2 id="claim-title">Make some noise.</h2>
          <span className="rank-stamp">MIN. {money.format(minimumBid)}</span>
        </div>
        <label className="mini" htmlFor="appStoreUrl">Your App Store link</label>
        <input className="field" id="appStoreUrl" required maxLength="2048" placeholder="apps.apple.com/app/id123456789" value={form.appStoreUrl} onChange={(event) => update("appStoreUrl", event.target.value)} />
        <label className="mini" htmlFor="pitch">The one-line flex</label>
        <input className="field" id="pitch" required minLength="12" maxLength="180" placeholder="I built something you should install." value={form.pitch} onChange={(event) => update("pitch", event.target.value)} />
        <div className="bid-row">
          <div className="amount-box"><span className="currency">$</span><input className="field" type="number" step="1" min={minimumBid} value={form.bid} aria-label="Bid in dollars" onChange={(event) => update("bid", event.target.value)} /></div>
          <button className="button" type="submit" disabled={isProcessing}>{isProcessing ? "Shouting…" : "Claim a spot"}</button>
        </div>
        <label className="rules-check"><input type="checkbox" required checked={form.acceptedRules} onChange={(event) => update("acceptedRules", event.target.checked)} /><span>I agree to the <a href="/terms">board rules</a>.</span></label>
        <div className="honeypot" aria-hidden="true"><label htmlFor="company">Company</label><input id="company" tabIndex="-1" autoComplete="off" value={form.company} onChange={(event) => update("company", event.target.value)} /></div>
        <p className="claim-note">{projectedRank ? <>This lands you at <b>#{projectedRank}</b> right now. </> : null}<b>{money.format(minimumBid)}</b> is the lowest claim. It is play money — nobody is charged. The app name, icon and category come straight from the App Store. Every claim halves in loudness each day, so the board never stops moving.</p>
      </form>
    </section>
  );
}

export function Leaderboard({ entries, filter, onFilter, onChallenge, boardState }) {
  const visibleEntries = entries.filter((entry) => filter === ALL_FILTER || entry.category === filter);
  // App Store genres, taken from whatever is actually on the board.
  const categories = [ALL_FILTER, ...Array.from(new Set(entries.map((entry) => entry.category).filter(Boolean))).sort()];

  return (
    <section id="board" aria-labelledby="board-title">
      <div className="section-head">
        <div>
          <span className="mini">Updated every time someone gets brave</span>
          <h2 id="board-title">The loud board</h2>
        </div>
        <p>iPhone and iPad apps only, pulled straight from the App Store. Nobody is charged a cent — it is play money. A claim needs to be one dollar louder than the app above it, and every claim halves in loudness each day, so nobody holds the top by sitting still.</p>
      </div>
      <div className="filters" role="tablist" aria-label="Board categories">
        {categories.map((category) => (
          <button className={`filter ${filter === category ? "active" : ""}`} key={category} onClick={() => onFilter(category)} role="tab" aria-selected={filter === category}>
            {category === ALL_FILTER ? "All noise" : category}
          </button>
        ))}
      </div>
      <div className="board" aria-live="polite">
        {visibleEntries.map((entry) => {
          const rank = entries.indexOf(entry) + 1;
          return <Entry key={entry.id} entry={entry} rank={rank} onChallenge={onChallenge} />;
        })}
        {boardState === "error" && <div className="empty-board"><b>The board is taking a breather.</b><span>We could not reach the live ranks just now. Nothing here is guessed — it will reappear on its own.</span></div>}
        {boardState !== "error" && visibleEntries.length === 0 && <div className="empty-board"><b>The board is waiting.</b><span>Be the first developer reckless enough to claim a spot.</span></div>}
      </div>
    </section>
  );
}

function Entry({ entry, rank, onChallenge }) {
  // Anything below the number originally shouted has already started fading.
  const faded = entry.claimedBid && entry.bid < entry.claimedBid - 0.5;

  return (
    <article className={`entry ${rank === 1 ? "first" : ""}`}>
      <div className="place">#{rank}<span className="place-label">{rank === 1 ? "currently loudest" : "on the radar"}</span></div>
      <div className="product">
        {entry.iconUrl ? <img className="app-icon" src={entry.iconUrl} alt="" width="44" height="44" loading="lazy" /> : null}
        <div className="product-text">
          <h3 className="product-name">{entry.name}</h3>
          <span className="product-url">{entry.developer}</span>
        </div>
      </div>
      <p className="pitch">{entry.pitch}</p>
      <div><span className="tag">{entry.category}</span></div>
      <div className="price">
        <b>{money.format(entry.bid)}</b>
        <span>to beat: {money.format(Math.round(entry.bid) + 1)}</span>
        {faded ? <span>↓ fading from {money.format(entry.claimedBid)}</span> : null}
      </div>
      <button className="claim-mini" onClick={() => onChallenge(entry)}>Out-loud<br />this spot</button>
    </article>
  );
}

export function ActivityFeed({ activity }) {
  return (
    <section className="activity" id="activity" aria-labelledby="activity-title">
      <div className="activity-title">
        <span className="mini">An ego in motion</span>
        <h2 id="activity-title">This is<br />the noise.</h2>
        <p>Every nudge, flex and glorious overreach appears here first. Screenshot responsibly.</p>
      </div>
      <div className="activity-list">
        {activity.length === 0 && <div className="event"><span className="event-time">QUIET</span><div className="event-copy">No claims yet. The first one gets the whole room.</div></div>}
        {activity.slice(0, 5).map((event) => (
          <div className="event" key={event.id}>
            <span className="event-time">{event.time}</span>
            <div className="event-copy"><b>{event.subject}</b>{event.copy}</div>
            <span className={`event-rank ${event.up ? "up" : ""}`}>{event.rank}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Toast({ notice, onClose }) {
  return (
    <div className={`toast ${notice ? "show" : ""}`} role="status" aria-live="polite">
      <button onClick={onClose} aria-label="Dismiss">×</button>
      <strong>{notice?.title ?? "Your noise is ready."}</strong>
      <p>{notice?.message ?? "You just grabbed a part of the board."}</p>
    </div>
  );
}
