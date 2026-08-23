import "server-only";

import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl, getDecayHalfLifeSeconds, getRequiredBidFloor } from "./env";

let schemaPromise;

function sql() {
  return neon(getDatabaseUrl());
}

// A claim's loudness halves every half-life. Rank is always computed from this
// decayed value rather than the number someone typed, so the board cannot be
// won permanently by whoever shouts the biggest number first.
// The half-life has to be inlined rather than bound: a bind parameter cannot
// carry the `.0` that forces float division.
const DECAYED = (query, alias = "") => {
  const prefix = alias ? `${alias}.` : "";
  const halfLife = Number(getDecayHalfLifeSeconds());
  return query.unsafe(`(${prefix}amount_cents * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - ${prefix}claimed_at)) / ${halfLife}.0))`);
};

async function createSchema() {
  const query = sql();
  await query`CREATE TABLE IF NOT EXISTS loudlist_claims (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    display_name TEXT NOT NULL,
    pitch TEXT NOT NULL,
    category TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hidden BOOLEAN NOT NULL DEFAULT FALSE
  )`;
  await query`CREATE INDEX IF NOT EXISTS loudlist_claims_board_idx ON loudlist_claims (claimed_at DESC) WHERE hidden = FALSE`;

  // The floor lives in env.js. Re-assert it as a named constraint on every schema
  // init so changing it there can never drift from what the table enforces.
  const floor = getRequiredBidFloor();
  if (!Number.isSafeInteger(floor) || floor < 0) throw new Error("Bid floor must be a non-negative integer.");
  await query`ALTER TABLE loudlist_claims DROP CONSTRAINT IF EXISTS loudlist_claims_min_amount`;
  await query`ALTER TABLE loudlist_claims ADD CONSTRAINT loudlist_claims_min_amount CHECK (amount_cents >= ${query.unsafe(String(floor))})`;

  await query`CREATE TABLE IF NOT EXISTS loudlist_rate_events (
    id BIGSERIAL PRIMARY KEY,
    identifier TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await query`CREATE INDEX IF NOT EXISTS loudlist_rate_events_idx ON loudlist_rate_events (identifier, created_at DESC)`;
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
  const decayedCents = row.decayed_cents === undefined ? Number(row.amount_cents) : Number(row.decayed_cents);
  return {
    id: row.id,
    url: row.url,
    name: row.display_name,
    pitch: row.pitch,
    category: row.category,
    // `bid` is the live, decayed number — what the board shows and what anyone
    // has to beat. `claimedBid` is what was originally shouted.
    bid: decayedCents / 100,
    claimedBid: Number(row.amount_cents) / 100,
    amountCents: Number(row.amount_cents),
    decayedCents,
    hidden: Boolean(row.hidden),
    rank: row.rank === null || row.rank === undefined ? null : Number(row.rank),
    claimedAt: row.claimed_at,
  };
}

export async function getMinimumBidCents() {
  return getRequiredBidFloor();
}

export async function getProjectedRank(amountCents) {
  await ensureSchema();
  const query = sql();
  const [row] = await query`
    SELECT COUNT(*)::INTEGER AS ahead FROM loudlist_claims
    WHERE hidden = FALSE AND ${DECAYED(query)} >= ${amountCents}
  `;
  return Number(row.ahead) + 1;
}

export async function getLeaderboard(limit = 50) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    SELECT id, url, display_name, pitch, category, amount_cents, hidden, claimed_at,
      ${DECAYED(query)} AS decayed_cents,
      ROW_NUMBER() OVER (ORDER BY ${DECAYED(query)} DESC, claimed_at ASC, id ASC)::INTEGER AS rank
    FROM loudlist_claims
    WHERE hidden = FALSE
    ORDER BY ${DECAYED(query)} DESC, claimed_at ASC, id ASC
    LIMIT ${limit}
  `;
  return rows.map(mapClaim);
}

// Insert and read back in one statement. Splitting them would leave a window
// where the row lands but the read fails, telling someone they missed the board
// while their claim is sitting on it.
export async function createClaim({ id, url, pitch, category, amountCents }) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    WITH inserted AS (
      INSERT INTO loudlist_claims (id, url, display_name, pitch, category, amount_cents)
      VALUES (${id}, ${url}, ${displayNameFromUrl(url)}, ${pitch}, ${category}, ${amountCents})
      RETURNING id, url, display_name, pitch, category, amount_cents, hidden, claimed_at
    )
    SELECT c.id, c.url, c.display_name, c.pitch, c.category, c.amount_cents, c.hidden, c.claimed_at,
      ${DECAYED(query, "c")} AS decayed_cents,
      (
        SELECT COUNT(*)::INTEGER + 1
        FROM loudlist_claims contender
        WHERE contender.hidden = FALSE AND contender.id <> c.id
          AND ${DECAYED(query, "contender")} > ${DECAYED(query, "c")}
      ) AS rank
    FROM inserted c
  `;
  return mapClaim(rows[0]);
}

export async function getClaim(claimId) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    SELECT c.id, c.url, c.display_name, c.pitch, c.category, c.amount_cents, c.hidden, c.claimed_at,
      ${DECAYED(query, "c")} AS decayed_cents,
      CASE WHEN c.hidden = FALSE THEN (
        SELECT COUNT(*)::INTEGER + 1
        FROM loudlist_claims contender
        WHERE contender.hidden = FALSE AND contender.id <> c.id
          AND ${DECAYED(query, "contender")} > ${DECAYED(query, "c")}
      ) ELSE NULL END AS rank
    FROM loudlist_claims c
    WHERE c.id = ${claimId}
    LIMIT 1
  `;
  return mapClaim(rows[0]);
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
    SELECT id, url, display_name, pitch, category, amount_cents, hidden, claimed_at,
      ${DECAYED(query)} AS decayed_cents, NULL::INTEGER AS rank
    FROM loudlist_claims ORDER BY claimed_at DESC LIMIT ${limit}
  `;
  return rows.map(mapClaim);
}

export async function recordClaimAttempt(identifier, windowSeconds, limit) {
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
