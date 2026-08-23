# LoudList

A public attention auction: a leaderboard of internet projects ranked by what people paid to be there. Next.js 16, Neon Postgres, Dodo Payments.

## How ranking works

Listings are ordered by amount paid, highest first, ties broken by who paid first. Paying one dollar more than an existing listing takes its slot and pushes it down. The cheapest way onto the board is the $7 floor.

## Trust model

The board only ever reflects money that actually moved:

- `POST /api/checkout` writes a **pending** claim and opens a Dodo checkout session. Pending claims are invisible.
- `POST /api/webhooks/dodo` is the only thing that can promote a claim to **paid**. It verifies Dodo's signature, and records every webhook id in `loudlist_webhook_events` so retries cannot double-apply.
- Return URLs carry no authority. A user landing on `/checkout/success` polls `/api/claims/status` until the webhook lands.

Never move rank-changing logic to the client or to the return URL.

## Setup

```bash
cp .env.example .env.local   # fill in DATABASE_URL and the Dodo keys
npm install
npm run dev
```

The schema creates itself on first query — tables, indexes, and the `hidden` column are all `IF NOT EXISTS`.

Without `DATABASE_URL` the board shows sample listings from `app/data.js` as a design preview, and checkout returns 503. If the API is configured but fails, the board renders an error state rather than sample data — real ranks are never faked.

## Moderation

`app/api/admin/claims` is guarded by `LOUDLIST_ADMIN_TOKEN` (constant-time compared).

```bash
# list every claim, including hidden and pending
curl -H "Authorization: Bearer $LOUDLIST_ADMIN_TOKEN" localhost:3000/api/admin/claims

# hide a listing (removes it from the board, keeps the payment record)
curl -X PATCH -H "Authorization: Bearer $LOUDLIST_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"claimId":"<uuid>","hidden":true}' localhost:3000/api/admin/claims
```

Hidden claims are excluded from the board, from rank calculations, and from projected ranks.

## Rate limiting

Checkout is limited to 5 attempts per IP per minute, in Postgres (`loudlist_rate_events`). It fails **closed** — if the database is unreachable, checkout is refused rather than left open.

## Production check

```bash
npm run build && npm run start
```

Point the Dodo webhook at `https://<your-domain>/api/webhooks/dodo` and set `NEXT_PUBLIC_SITE_URL` to the real origin.

## Decisions already made (and why)

Context for anyone — human or agent — picking this up cold.

**Per-slot bidding, not top-the-board.** The original backend required `MAX(amount) + $1` to claim anything, so #1 was the only purchasable position while the UI advertised per-row prices ("to beat: $130"). Every "Out-loud this spot" button silently jumped to the global maximum. Resolved in favour of what the design already sold: pay $1 over any listing, take its slot, push it down. Eight rows means eight live price points and a cheap way in — far better for virality than one big prize. If you ever reverse this, the UI copy in `components.js` and `page.js` has to change with it.

**The webhook is the only authority.** Checkout writes a `pending` row; only a signature-verified `payment.succeeded` promotes it to `paid`. Return URLs carry no authority — `/checkout/success` polls `/api/claims/status` because the browser usually beats the webhook home. Never move rank-changing logic to the client or the return URL, however convenient it looks.

**Nothing on the page may be invented.** The site sells a public receipt for money spent, so fabricated numbers are an existential trust problem, not a cosmetic one. A fake viewer counter and hardcoded "1,894 spots / 18.4M eyeballs" were removed, and a failed board fetch now renders an error instead of leaving sample listings on screen to bid against. Sample data from `app/data.js` appears only when `DATABASE_URL` is unset — a local design preview, never in production.

**Rate limiting fails closed.** No database means no checkout. Refusing a sale beats letting an unlimited one through.

**Neon over Supabase/Convex.** Neon scale-to-zero suits a site that may sit idle, and the schema is real Postgres (`ROW_NUMBER`, partial indexes, `ON CONFLICT`), so switching engines means rewriting `db.js`. Convex is arguably the better long-term fit — live subscriptions would replace the 15s poll, and its serializable mutations would simplify the rank and idempotency logic — but adopting it replaces every API route, not just the database. Revisit only once the product proves real-time is what makes the board addictive. If you do: Dodo's `webhooks.unwrap()` is a Node SDK call and Convex HTTP actions run in a V8 runtime, so signature verification needs Web Crypto by hand or a `"use node"` action. That is the piece the whole trust model rests on — verify it first.

## Open questions

- **Nothing has run against a real database.** Every change is build- and render-verified only. The first Neon connection is the real test: schema creation, the rank window function, webhook idempotency, and the Postgres rate limiter are all untried against live Postgres.
- **No payment has ever been processed.** Dodo test mode end-to-end is the next milestone.
- **`/terms` and `/privacy` are honest drafts, not legal advice.** They need a real review before the site takes money, and "pay to be listed" sits near the line in some processors' acceptable-use policies — read Dodo's before building further.
- **Moderation is API-only.** Hiding a listing means a `curl` with the admin token. Fine for launch, painful at volume; no admin UI exists.
- **No duplicate protection.** The same URL can claim any number of slots.
- **Listings are published instantly with no review.** The `hidden` flag is the only defence, and it is reactive.
- **No tests.** Highest-value first targets: the rank query and webhook idempotency.
