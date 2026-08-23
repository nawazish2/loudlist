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
