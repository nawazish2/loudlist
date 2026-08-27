"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatLoudness, money } from "../lib/money";

const TOKEN_KEY = "loudlist-admin-token";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [draft, setDraft] = useState("");
  const [claims, setClaims] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async (secret) => {
    const response = await fetch("/api/admin/claims", {
      headers: { Authorization: `Bearer ${secret}`, "Cache-Control": "no-store" },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Unable to load moderation.");
    return { claims: payload.claims || [], reports: payload.reports || [] };
  }, []);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(TOKEN_KEY) || "";
    if (!stored) return undefined;
    let cancelled = false;
    load(stored)
      .then((desk) => {
        if (cancelled) return;
        setToken(stored);
        setClaims(desk.claims);
        setReports(desk.reports);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const claimsById = useMemo(() => Object.fromEntries(claims.map((claim) => [claim.id, claim])), [claims]);

  async function signIn(event) {
    event.preventDefault();
    setError("");
    try {
      const desk = await load(draft.trim());
      window.sessionStorage.setItem(TOKEN_KEY, draft.trim());
      setToken(draft.trim());
      setClaims(desk.claims);
      setReports(desk.reports);
      setDraft("");
    } catch (err) {
      setError(err.message || "That token did not work.");
    }
  }

  function signOut() {
    window.sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setClaims([]);
    setReports([]);
  }

  async function setHidden(claimId, hidden) {
    setBusyId(claimId);
    setError("");
    try {
      const response = await fetch("/api/admin/claims", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimId, hidden }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to update that listing.");
      const desk = await load(token);
      setClaims(desk.claims);
      setReports(desk.reports);
    } catch (err) {
      setError(err.message || "Unable to update that listing.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="admin-shell">
      <Link className="brand" href="/"><span className="brand-burst">!</span>LOUDLIST</Link>
      <span className="mini">Moderation</span>
      <h1>The quiet room.</h1>
      <p className="admin-lead">Hide listings that break the board rules. Reports land here first.</p>

      {!token && (
        <form className="admin-gate" onSubmit={signIn}>
          <label className="mini" htmlFor="admin-token">Admin token</label>
          <input
            className="field"
            id="admin-token"
            type="password"
            autoComplete="current-password"
            required
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="button" type="submit">Open the desk</button>
        </form>
      )}

      {token && (
        <div className="admin-toolbar">
          <span className="mini">{reports.length} reports · {claims.length} claims</span>
          <button className="claim-mini" type="button" onClick={signOut}>Sign out</button>
        </div>
      )}

      {error ? <p className="admin-error" role="alert">{error}</p> : null}

      {token && (
        <>
          <h2>Reports</h2>
          <div className="admin-list">
            {reports.length === 0 && <p className="admin-empty">No reports yet.</p>}
            {reports.map((report) => {
              const claim = claimsById[report.claim_id];
              return (
                <article className="admin-card" key={report.id}>
                  <div>
                    <b>{claim?.name || report.claim_id}</b>
                    <p>{report.reason}</p>
                    <span className="mini">{new Date(report.created_at).toLocaleString()}</span>
                  </div>
                  {claim && !claim.hidden ? (
                    <button className="button" type="button" disabled={busyId === claim.id} onClick={() => setHidden(claim.id, true)}>
                      Hide listing
                    </button>
                  ) : (
                    <span className="mini">{claim ? "Already hidden" : "Claim gone"}</span>
                  )}
                </article>
              );
            })}
          </div>

          <h2>Every claim</h2>
          <div className="admin-list">
            {claims.map((claim) => (
              <article className={`admin-card ${claim.hidden ? "hidden" : ""}`} key={claim.id}>
                <div>
                  <b>{claim.name}</b>
                  <p>{claim.pitch}</p>
                  <span className="mini">
                    {claim.hidden ? "Hidden" : "Live"} · {formatLoudness(claim.bid)} now · claimed {money.format(claim.claimedBid)}
                  </span>
                </div>
                <button
                  className={claim.hidden ? "button" : "claim-mini"}
                  type="button"
                  disabled={busyId === claim.id}
                  onClick={() => setHidden(claim.id, !claim.hidden)}
                >
                  {claim.hidden ? "Unhide" : "Hide"}
                </button>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
