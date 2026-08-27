import "server-only";

import { neon } from "@neondatabase/serverless";
import { BID_FLOOR_CENTS, DECAY_HALF_LIFE_SECONDS } from "./constants";
import { getDatabaseUrl } from "./env";

let schemaPromise;

function sql() {
  return neon(getDatabaseUrl());
}

// A claim's loudness halves every half-life. Rank is always computed from this
// decayed value rather than the number someone typed, so the board cannot be
// won permanently by whoever shouts the biggest number first.
//
// The half-life has to be inlined rather than bound: a bind parameter cannot
// carry the `.0` that forces float division.
const DECAYED = (query, alias = "") => {
  const prefix = alias ? `${alias}.` : "";
  return query.unsafe(`(${prefix}amount_cents * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - ${prefix}claimed_at)) / ${DECAY_HALF_LIFE_SECONDS}.0))`);
};

async function applied(query, id) {
  const rows = await query`SELECT id FROM loudlist_migrations WHERE id = ${id} LIMIT 1`;
  return rows.length > 0;
}

async function markApplied(query, id) {
  await query`INSERT INTO loudlist_migrations (id) VALUES (${id}) ON CONFLICT (id) DO NOTHING`;
}

async function createSchema() {
  const query = sql();
  await query`CREATE TABLE IF NOT EXISTS loudlist_migrations (
    id TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await query`CREATE TABLE IF NOT EXISTS loudlist_claims (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    url TEXT NOT NULL,
    display_name TEXT NOT NULL,
    developer TEXT NOT NULL,
    icon_url TEXT,
    pitch TEXT NOT NULL,
    category TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= ${query.unsafe(String(BID_FLOOR_CENTS))}),
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hidden BOOLEAN NOT NULL DEFAULT FALSE
  )`;

  await query`CREATE TABLE IF NOT EXISTS loudlist_rate_windows (
    identifier TEXT NOT NULL,
    window_start BIGINT NOT NULL,
    attempts INTEGER NOT NULL,
    PRIMARY KEY (identifier, window_start)
  )`;

  await query`CREATE TABLE IF NOT EXISTS loudlist_events (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    rank INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await query`CREATE TABLE IF NOT EXISTS loudlist_reports (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  if (!(await applied(query, "drop_app_id_full_unique"))) {
    await query`ALTER TABLE loudlist_claims DROP CONSTRAINT IF EXISTS loudlist_claims_app_id_key`;
    await query`DROP INDEX IF EXISTS loudlist_claims_app_id_key`;
    await markApplied(query, "drop_app_id_full_unique");
  }

  await query`CREATE UNIQUE INDEX IF NOT EXISTS loudlist_claims_visible_app_idx ON loudlist_claims (app_id) WHERE hidden = FALSE`;
  await query`CREATE INDEX IF NOT EXISTS loudlist_claims_visible_amount_idx ON loudlist_claims (amount_cents DESC, claimed_at ASC) WHERE hidden = FALSE`;
  await query`CREATE INDEX IF NOT EXISTS loudlist_events_created_idx ON loudlist_events (created_at DESC)`;
  await query`CREATE INDEX IF NOT EXISTS loudlist_reports_created_idx ON loudlist_reports (created_at DESC)`;

  if (!(await applied(query, "min_amount_check_once"))) {
    await query.unsafe(`
      DO $$ BEGIN
        ALTER TABLE loudlist_claims ADD CONSTRAINT loudlist_claims_min_amount CHECK (amount_cents >= ${BID_FLOOR_CENTS});
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await markApplied(query, "min_amount_check_once");
  }
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

function mapClaim(row) {
  if (!row) return null;
  const decayedCents = row.decayed_cents === undefined ? Number(row.amount_cents) : Number(row.decayed_cents);
  return {
    id: row.id,
    appId: row.app_id,
    url: row.url,
    name: row.display_name,
    developer: row.developer,
    iconUrl: row.icon_url,
    pitch: row.pitch,
    category: row.category,
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
  return BID_FLOOR_CENTS;
}

export async function getLeaderboard(limit = 50) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    SELECT id, app_id, url, display_name, developer, icon_url, pitch, category, amount_cents, hidden, claimed_at,
      ${DECAYED(query)} AS decayed_cents,
      ROW_NUMBER() OVER (ORDER BY ${DECAYED(query)} DESC, claimed_at ASC, id ASC)::INTEGER AS rank
    FROM loudlist_claims
    WHERE hidden = FALSE
    ORDER BY ${DECAYED(query)} DESC, claimed_at ASC, id ASC
    LIMIT ${limit}
  `;
  return rows.map(mapClaim);
}

export async function getRecentEvents(limit = 5) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    SELECT e.id, e.claim_id, e.display_name, e.amount_cents, e.rank, e.created_at
    FROM loudlist_events e
    JOIN loudlist_claims c ON c.id = e.claim_id
    WHERE c.hidden = FALSE
    ORDER BY e.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => ({
    id: row.id,
    claimId: row.claim_id,
    name: row.display_name,
    claimedBid: Number(row.amount_cents) / 100,
    rank: row.rank === null || row.rank === undefined ? null : Number(row.rank),
    claimedAt: row.created_at,
  }));
}

export async function claimApp({ id, appId, url, name, developer, iconUrl, pitch, category, amountCents }) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    WITH upserted AS (
      INSERT INTO loudlist_claims (id, app_id, url, display_name, developer, icon_url, pitch, category, amount_cents, hidden)
      VALUES (${id}, ${appId}, ${url}, ${name}, ${developer}, ${iconUrl}, ${pitch}, ${category}, ${amountCents}, FALSE)
      ON CONFLICT (app_id) WHERE hidden = FALSE DO UPDATE SET
        amount_cents = EXCLUDED.amount_cents,
        claimed_at = NOW(),
        pitch = EXCLUDED.pitch,
        url = EXCLUDED.url,
        display_name = EXCLUDED.display_name,
        developer = EXCLUDED.developer,
        icon_url = EXCLUDED.icon_url,
        category = EXCLUDED.category,
        hidden = FALSE
      WHERE EXCLUDED.amount_cents >= (FLOOR(${DECAYED(query, "loudlist_claims")})::INTEGER + 100)
      RETURNING id, app_id, url, display_name, developer, icon_url, pitch, category, amount_cents, hidden, claimed_at
    ), ranked AS (
      SELECT c.id, c.app_id, c.url, c.display_name, c.developer, c.icon_url, c.pitch, c.category, c.amount_cents, c.hidden, c.claimed_at,
        ${DECAYED(query, "c")} AS decayed_cents,
        board.rank
      FROM upserted c
      JOIN (
        SELECT id, ROW_NUMBER() OVER (ORDER BY ${DECAYED(query)} DESC, claimed_at ASC, id ASC)::INTEGER AS rank
        FROM loudlist_claims
        WHERE hidden = FALSE
      ) board ON board.id = c.id
    ), recorded AS (
      INSERT INTO loudlist_events (id, claim_id, app_id, display_name, amount_cents, rank)
      SELECT ${crypto.randomUUID()}, id, app_id, display_name, amount_cents, rank FROM ranked
      RETURNING claim_id
    )
    SELECT ranked.id, ranked.app_id, ranked.url, ranked.display_name, ranked.developer, ranked.icon_url, ranked.pitch, ranked.category,
      ranked.amount_cents, ranked.hidden, ranked.claimed_at, ranked.decayed_cents, ranked.rank
    FROM ranked
    JOIN recorded ON recorded.claim_id = ranked.id
  `;
  return mapClaim(rows[0]);
}

export async function getCurrentBidForApp(appId) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    SELECT ${DECAYED(query)} AS decayed_cents
    FROM loudlist_claims
    WHERE app_id = ${appId} AND hidden = FALSE
    LIMIT 1
  `;
  return rows.length ? Number(rows[0].decayed_cents) : null;
}

export async function getClaim(claimId) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    SELECT c.id, c.app_id, c.url, c.display_name, c.developer, c.icon_url, c.pitch, c.category, c.amount_cents, c.hidden, c.claimed_at,
      ${DECAYED(query, "c")} AS decayed_cents,
      CASE WHEN c.hidden = FALSE THEN board.rank ELSE NULL END AS rank
    FROM loudlist_claims c
    LEFT JOIN (
      SELECT id, ROW_NUMBER() OVER (ORDER BY ${DECAYED(query)} DESC, claimed_at ASC, id ASC)::INTEGER AS rank
      FROM loudlist_claims
      WHERE hidden = FALSE
    ) board ON board.id = c.id
    WHERE c.id = ${claimId}
    LIMIT 1
  `;
  return mapClaim(rows[0]);
}

export async function setClaimHidden(claimId, hidden) {
  await ensureSchema();
  const query = sql();

  if (hidden) {
    const rows = await query`UPDATE loudlist_claims SET hidden = TRUE WHERE id = ${claimId} RETURNING id`;
    return { updated: rows.length === 1 };
  }

  const rows = await query`
    UPDATE loudlist_claims SET hidden = FALSE
    WHERE id = ${claimId}
      AND NOT EXISTS (
        SELECT 1 FROM loudlist_claims other
        WHERE other.app_id = loudlist_claims.app_id
          AND other.hidden = FALSE
          AND other.id <> ${claimId}
      )
    RETURNING id
  `;
  if (rows.length === 1) return { updated: true };

  const existing = await query`SELECT hidden FROM loudlist_claims WHERE id = ${claimId} LIMIT 1`;
  if (!existing.length) return { updated: false };
  if (!existing[0].hidden) return { updated: true };
  return { conflict: true };
}

export async function listAllClaims(limit = 200) {
  await ensureSchema();
  const query = sql();
  const rows = await query`
    SELECT id, app_id, url, display_name, developer, icon_url, pitch, category, amount_cents, hidden, claimed_at,
      ${DECAYED(query)} AS decayed_cents, NULL::INTEGER AS rank
    FROM loudlist_claims ORDER BY claimed_at DESC LIMIT ${limit}
  `;
  return rows.map(mapClaim);
}

export async function listReports(limit = 100) {
  await ensureSchema();
  const query = sql();
  return query`
    SELECT id, claim_id, reason, created_at
    FROM loudlist_reports
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

export async function createReport({ id, claimId, reason }) {
  await ensureSchema();
  const query = sql();
  const claim = await getClaim(claimId);
  if (!claim || claim.hidden) return null;
  await query`INSERT INTO loudlist_reports (id, claim_id, reason) VALUES (${id}, ${claimId}, ${reason})`;
  return { id, claimId, reason, name: claim.name };
}

export async function recordClaimAttempt(identifier, windowSeconds, limit) {
  await ensureSchema();
  const query = sql();
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000));
  const [row] = await query`
    INSERT INTO loudlist_rate_windows (identifier, window_start, attempts)
    VALUES (${identifier}, ${windowStart}, 1)
    ON CONFLICT (identifier, window_start)
    DO UPDATE SET attempts = loudlist_rate_windows.attempts + 1
    RETURNING attempts
  `;
  const attempts = Number(row.attempts);
  if (attempts === 1) {
    await query`DELETE FROM loudlist_rate_windows WHERE window_start < ${windowStart - 2}`;
  }
  return { success: attempts <= limit, attempts };
}
