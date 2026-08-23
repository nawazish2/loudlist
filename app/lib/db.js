import "server-only";

import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl, getRequiredBidFloor } from "./env";

let schemaPromise;

function sql() {
  return neon(getDatabaseUrl());
}

async function createSchema() {
  const query = sql();
  await query`CREATE TABLE IF NOT EXISTS loudlist_claims (
    id TEXT PRIMARY KEY,
    checkout_session_id TEXT UNIQUE,
    payment_id TEXT UNIQUE,
    url TEXT NOT NULL,
    display_name TEXT NOT NULL,
    pitch TEXT NOT NULL,
    category TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ
  )`;
  await query`ALTER TABLE loudlist_claims ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT FALSE`;

  // The floor lives in env.js. Re-assert it as a named constraint on every schema
  // init so changing it there can never drift from what the table enforces —
  // including on databases created before the floor moved.
  const floor = getRequiredBidFloor();
  if (!Number.isSafeInteger(floor) || floor < 0) throw new Error("Bid floor must be a non-negative integer.");
  await query`ALTER TABLE loudlist_claims DROP CONSTRAINT IF EXISTS loudlist_claims_amount_cents_check`;
  await query`ALTER TABLE loudlist_claims DROP CONSTRAINT IF EXISTS loudlist_claims_min_amount`;
  await query`ALTER TABLE loudlist_claims ADD CONSTRAINT loudlist_claims_min_amount CHECK (amount_cents >= ${query.unsafe(String(floor))})`;
  await query`CREATE INDEX IF NOT EXISTS loudlist_claims_paid_rank_idx ON loudlist_claims (amount_cents DESC, paid_at ASC) WHERE status = 'paid'`;
  await query`CREATE INDEX IF NOT EXISTS loudlist_claims_session_idx ON loudlist_claims (checkout_session_id)`;
  await query`CREATE TABLE IF NOT EXISTS loudlist_rate_events (
    id BIGSERIAL PRIMARY KEY,
    identifier TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await query`CREATE INDEX IF NOT EXISTS loudlist_rate_events_idx ON loudlist_rate_events (identifier, created_at DESC)`;
  await query`CREATE TABLE IF NOT EXISTS loudlist_webhook_events (
    webhook_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = createSchema().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  return schemaPromise;
}

function displayNameFromUrl(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}

function mapClaim(row) {
  if (!row) return null;
  return {
    id: row.id,
    url: row.url,
    name: row.display_name,
    pitch: row.pitch,
    category: row.category,
    bid: Number(row.amount_cents) / 100,
    amountCents: Number(row.amount_cents),
    status: row.status,
    hidden: Boolean(row.hidden),
    rank: row.rank === null || row.rank === undefined ? null : Number(row.rank),
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

export async function getMinimumBidCents() {
  return getRequiredBidFloor();
}

export async function getProjectedRank(amountCents) {
  await ensureSchema();
  const query = sql();
  const [row] = await query`SELECT COUNT(*)::INTEGER AS ahead FROM loudlist_claims WHERE status = 'paid' AND hidden = FALSE AND amount_cents >= ${amountCents}`;
  return Number(row.ahead) + 1;
}

export async function getLeaderboard(limit = 50) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    SELECT id, url, display_name, pitch, category, amount_cents, status, created_at, paid_at,
      ROW_NUMBER() OVER (ORDER BY amount_cents DESC, paid_at ASC, id ASC)::INTEGER AS rank
    FROM loudlist_claims
    WHERE status = 'paid' AND hidden = FALSE
    ORDER BY amount_cents DESC, paid_at ASC, id ASC
    LIMIT ${limit}
  `;
  return rows.map(mapClaim);
}

export async function createPendingClaim({ id, url, pitch, category, amountCents }) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    INSERT INTO loudlist_claims (id, url, display_name, pitch, category, amount_cents)
    VALUES (${id}, ${url}, ${displayNameFromUrl(url)}, ${pitch}, ${category}, ${amountCents})
    RETURNING id, url, display_name, pitch, category, amount_cents, status, created_at, paid_at, NULL::INTEGER AS rank
  `;
  return mapClaim(rows[0]);
}

export async function attachCheckoutSession(claimId, checkoutSessionId) {
  await ensureSchema();
  const query = sql();
  await query`UPDATE loudlist_claims SET checkout_session_id = ${checkoutSessionId} WHERE id = ${claimId} AND status = 'pending'`;
}

export async function cancelPendingClaim(claimId) {
  await ensureSchema();
  const query = sql();
  await query`UPDATE loudlist_claims SET status = 'cancelled' WHERE id = ${claimId} AND status = 'pending' AND checkout_session_id IS NULL`;
}

export async function getClaim(claimId) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    SELECT c.id, c.url, c.display_name, c.pitch, c.category, c.amount_cents, c.status, c.hidden, c.created_at, c.paid_at,
      CASE WHEN c.status = 'paid' AND c.hidden = FALSE THEN (
        SELECT COUNT(*)::INTEGER + 1
        FROM loudlist_claims contender
        WHERE contender.status = 'paid' AND contender.hidden = FALSE
          AND (contender.amount_cents > c.amount_cents OR (contender.amount_cents = c.amount_cents AND (contender.paid_at < c.paid_at OR (contender.paid_at = c.paid_at AND contender.id < c.id))))
      ) ELSE NULL END AS rank
    FROM loudlist_claims c
    WHERE c.id = ${claimId}
    LIMIT 1
  `;
  return mapClaim(rows[0]);
}

export async function activateClaim({ claimId, paymentId }) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    UPDATE loudlist_claims
    SET status = 'paid', payment_id = COALESCE(payment_id, ${paymentId}), paid_at = COALESCE(paid_at, NOW())
    WHERE id = ${claimId} AND status = 'pending'
    RETURNING id
  `;
  return { activated: rows.length === 1, claim: await getClaim(claimId) };
}

// Refunds and disputes never carry our claim_id: the refund payload has its own
// metadata, and dispute payloads have no metadata at all. Both carry payment_id,
// which is why it is stored on the claim.
export async function hideClaimByPaymentId(paymentId) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    UPDATE loudlist_claims SET hidden = TRUE
    WHERE payment_id = ${paymentId} AND hidden = FALSE
    RETURNING id
  `;
  return rows[0]?.id ?? null;
}

// Claims the webhook id, returning false when this delivery was already handled.
export async function claimWebhook(webhookId, eventType) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    INSERT INTO loudlist_webhook_events (webhook_id, event_type)
    VALUES (${webhookId}, ${eventType})
    ON CONFLICT (webhook_id) DO NOTHING
    RETURNING webhook_id
  `;
  return rows.length === 1;
}

// Releases a claimed webhook id after failed processing, so Dodo's retry is not
// mistaken for a duplicate and silently dropped.
export async function releaseWebhook(webhookId) {
  const query = sql();
  await query`DELETE FROM loudlist_webhook_events WHERE webhook_id = ${webhookId}`;
}

export async function setClaimHidden(claimId, hidden) {
  await ensureSchema();
  const query = sql();
  const rows = await query`UPDATE loudlist_claims SET hidden = ${hidden} WHERE id = ${claimId} RETURNING id`;
  return rows.length === 1;
}

export async function listAllClaims(limit = 200) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    SELECT id, url, display_name, pitch, category, amount_cents, status, hidden, created_at, paid_at, NULL::INTEGER AS rank
    FROM loudlist_claims ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rows.map(mapClaim);
}

export async function recordCheckoutAttempt(identifier, windowSeconds, limit) {
  await ensureSchema();
  const query = sql();
  await query`INSERT INTO loudlist_rate_events (identifier) VALUES (${identifier})`;
  const [row] = await query`
    SELECT COUNT(*)::INTEGER AS attempts FROM loudlist_rate_events
    WHERE identifier = ${identifier} AND created_at > NOW() - (${windowSeconds} * INTERVAL '1 second')
  `;
  const attempts = Number(row.attempts);
  if (attempts === 1) await query`DELETE FROM loudlist_rate_events WHERE created_at < NOW() - INTERVAL '1 hour'`;
  return { success: attempts <= limit, attempts };
}
