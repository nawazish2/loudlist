# LoudList

A public attention auction played with play money: a leaderboard of iPhone and iPad apps ranked by how loudly someone claimed a spot. Next.js 16, Neon Postgres.

Nothing is charged, ever. There is no payment processor and no card form. The dollar amounts are a number you pick.

## Listings come from the App Store

A claim is an App Store link plus a pitch. The server resolves the link through Apple's public iTunes lookup API and takes the app's name, developer, icon and category from there, so listings cannot be misnamed and the board cannot fill up with things that are not iOS apps.

Two details worth knowing before changing `app/lib/appstore.js`:

- **`entity=software` does not exclude Mac apps.** The lookup happily returns `kind: "mac-software"` for Final Cut Pro, and songs and books for other ids. The `kind === "software"` check is what keeps this board iOS-only — do not remove it.
- **One visible listing per app**, enforced by a unique index on `app_id` where `hidden = FALSE`. Re-claiming an app that is already listed replaces its listing, which is how a spot is defended as it fades. That upsert only applies when the new amount is at least one whole dollar above the listing's *current decayed* loudness, otherwise anyone could knock a rival down by re-claiming their app for the same number. A hidden listing does not keep the `app_id` blocked — a new claim can seat that app again.

## How ranking works

Listings are ordered by their **current** loudness, highest first, ties broken by whichever app claimed first (then by id). Taking a listed app's spot means claiming at least one whole dollar more than that app is worth right now. The cheapest way onto the board is the $1 floor (`BID_FLOOR_CENTS` in `app/lib/constants.ts`). That floor is hardcoded on purpose.

The word *current* is doing the work: a claim loses **half its loudness every 24 hours**. A $90 claim is worth $45 tomorrow and $22.50 the day after. Nobody holds the top of the board by getting there first — only by coming back and shouting again.

Reclaiming the same app requires at least **one whole dollar more** than its current decayed loudness. A same-dollar shout is refused, even a millisecond later, so a listing cannot be stolen by repeating the number on the board.

That decay is what replaces money. Since claiming is free, without it the board would be won permanently by whoever typed the biggest number, and the ceiling (`LOUDLIST_MAX_BID_CENTS`, default $5,000) is what keeps that number bounded so the decay can catch up with it.

Decay is computed at query time from `claimed_at` — there is no background job, and nothing rewrites the stored amount. `amount_cents` is always what was originally claimed; the decayed value is derived on every read.

## Setup

```bash
cp .env.example .env.local   # fill in DATABASE_URL
pnpm install
pnpm dev
```

Schema changes apply through named rows in `loudlist_migrations`. `CREATE TABLE IF NOT EXISTS` still runs on first query so a fresh database comes up, but constraints are not dropped on every cold start.

Without `DATABASE_URL`, local `pnpm dev` shows sample listings from `app/data.js` as a design preview, and claiming returns 503. In production the same missing URL fails closed — an empty error board, never fake ranks. If the API is configured but fails, the board renders an error state rather than sample data.

## Moderation

Open `/admin` and paste `LOUDLIST_ADMIN_TOKEN`, or call `app/api/admin/claims` with `Authorization: Bearer <token>` (SHA-256 compared in constant time). Reports filed from the board are included on GET. Set `LOUDLIST_REPORT_WEBHOOK_URL` to ping Slack or Discord when a report lands.

```bash
# list every claim, including hidden ones, plus reports
curl -H "Authorization: Bearer $LOUDLIST_ADMIN_TOKEN" localhost:3000/api/admin/claims

# hide a listing
curl -X PATCH -H "Authorization: Bearer $LOUDLIST_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"claimId":"<uuid>","hidden":true}' localhost:3000/api/admin/claims
```

Hidden claims are excluded from the board and from rank calculations. Receipt links still show a taken-down state. Unhiding is refused if that app already has a live listing — hide the live row first. The `app_id` of a hidden listing is free for a new claim.

## Rate limiting

Claiming is limited to 5 attempts per IP per 10-minute window, in Postgres (`loudlist_rate_windows`). The counter increments atomically. Invalid payloads are rejected before a token is spent. It fails **closed** — if the database is unreachable, claiming is refused rather than left open. Because claiming costs nothing, this is the only thing standing between the board and a flood, so do not loosen it casually.

IP records are deleted after the window expires, and are never attached to a listing.

## Production check

```bash
pnpm build && pnpm start
```

Set `NEXT_PUBLIC_SITE_URL` to the real origin. Claim and report POSTs must come from that origin (or a matching Referer). Rate limits use Vercel's client IP when `x-vercel-id` is present.
