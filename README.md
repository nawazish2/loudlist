# LoudList

A public attention auction played with play money: a leaderboard of iPhone and iPad apps ranked by how loudly someone claimed a spot. Next.js 16, Neon Postgres.

Nothing is charged, ever. There is no payment processor and no card form. The dollar amounts are a number you pick.

## Listings come from the App Store

A claim is an App Store link plus a pitch. The server resolves the link through Apple's public iTunes lookup API and takes the app's name, developer, icon and category from there, so listings cannot be misnamed and the board cannot fill up with things that are not iOS apps.

Two details worth knowing before changing `app/lib/appstore.js`:

- **`entity=software` does not exclude Mac apps.** The lookup happily returns `kind: "mac-software"` for Final Cut Pro, and songs and books for other ids. The `kind === "software"` check is what keeps this board iOS-only — do not remove it.
- **One listing per app**, enforced by a unique constraint on `app_id`. Re-claiming an app that is already listed replaces its listing, which is how a spot is defended as it fades. That upsert only applies when the new amount beats the listing's *current decayed* value, otherwise anyone could knock a rival down by re-claiming their app for a dollar.

## How ranking works

Listings are ordered by their **current** loudness, highest first, ties broken by whichever app claimed first. Claiming one dollar more than an existing listing takes its slot and pushes it down. The cheapest way onto the board is the $1 floor.

The word *current* is doing the work: a claim loses **half its loudness every 24 hours**. A $90 claim is worth $45 tomorrow and $22.50 the day after. Nobody holds the top of the board by getting there first — only by coming back and shouting again.

That decay is what replaces money. Since claiming is free, without it the board would be won permanently by whoever typed the biggest number, and the ceiling (`LOUDLIST_MAX_BID_CENTS`, default $5,000) is what keeps that number bounded so the decay can catch up with it.

Decay is computed at query time from `claimed_at` — there is no background job, and nothing rewrites the stored amount. `amount_cents` is always what was originally claimed; the decayed value is derived on every read.

## Setup

```bash
cp .env.example .env.local   # fill in DATABASE_URL
npm install
npm run dev
```

The schema creates itself on first query. The bid floor is re-asserted as a named constraint on every schema init, so changing `getRequiredBidFloor()` in `app/lib/env.js` can never drift from what the database enforces.

Without `DATABASE_URL` the board shows sample listings from `app/data.js` as a design preview, and claiming returns 503. If the API is configured but fails, the board renders an error state rather than sample data — real ranks are never faked.

## Moderation

`app/api/admin/claims` is guarded by `LOUDLIST_ADMIN_TOKEN` (constant-time compared).

```bash
# list every claim, including hidden ones
curl -H "Authorization: Bearer $LOUDLIST_ADMIN_TOKEN" localhost:3000/api/admin/claims

# hide a listing
curl -X PATCH -H "Authorization: Bearer $LOUDLIST_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"claimId":"<uuid>","hidden":true}' localhost:3000/api/admin/claims
```

Hidden claims are excluded from the board, from rank calculations, and from their own reported rank.

## Rate limiting

Claiming is limited to 5 attempts per IP per 10 minutes, in Postgres (`loudlist_rate_events`). It fails **closed** — if the database is unreachable, claiming is refused rather than left open. Because claiming costs nothing, this is the only thing standing between the board and a flood, so do not loosen it casually.

IP records are deleted automatically about an hour after they are written, and are never attached to a listing.

## Production check

```bash
npm run build && npm run start
```

Set `NEXT_PUBLIC_SITE_URL` to the real origin.
