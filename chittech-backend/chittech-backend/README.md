# ChitTech Backend (MVP)

Digital chit-fund platform backend — Node.js/Express, PostgreSQL, Redis, Socket.IO, JWT, Razorpay.

## Quick start

```bash
cp .env.example .env          # fill in real values (JWT secret, Razorpay keys, etc.)
docker-compose up -d          # starts local Postgres + Redis
npm install
npm run migrate               # applies SQL migrations
npm run seed                  # creates 1 admin + 2 chit groups + 5 subscribers
npm run dev                   # starts API on http://localhost:4000
```

Run tests (dividend calculation is the critical path and is unit-tested):
```bash
npm test
```

## Auth flow (mock OTP)

1. `POST /api/v1/auth/otp/request { phone }` — OTP is **printed to the server console**, not
   actually sent (`TODO(compliance)`: swap in a real SMS provider for production).
2. `POST /api/v1/auth/otp/verify { phone, code }` — returns `{ token, role, user }`. First-time
   phone numbers are auto-created as `role: user`; the seeded admin phone already exists as
   `role: admin`.

Seeded accounts (see `npm run seed` output):
- Admin: `+919999900000`
- 5 subscribers: `+919999900001` … `+919999900005`, all pre-enrolled in the first seeded chit group.

## Live auction flow

1. Admin schedules: `POST /api/v1/chit-groups/:groupId/auctions`
2. Admin starts: `POST /api/v1/auctions/:id/start` → status `LIVE`, Redis state initialized.
3. Clients connect via Socket.IO, emit `join_auction` with `{ auctionId }` to join the room
   `auction:<id>`, then listen for `bid_placed` and `auction_closed` events.
4. Subscribers bid (reverse auction — lowest % wins): `POST /api/v1/auctions/:id/bid { bidPct }`.
   Rate-limited to 5 requests / 10s per user+IP. Every bid is written to `auction_bids` for audit,
   in addition to updating the live Redis state and broadcasting over the socket.
5. Admin closes: `POST /api/v1/auctions/:id/close` — reads the final lowest bid from Redis,
   persists the result, marks the winning subscription `PS`, and runs the dividend calculation,
   writing `COMMISSION`, `PRIZE_PAYOUT`, and `DIVIDEND` rows to `ledger_entries`.

## Full endpoint list

| Method | Path | Auth |
|---|---|---|
| GET | `/health` | none |
| POST | `/api/v1/auth/otp/request` | none (rate-limited) |
| POST | `/api/v1/auth/otp/verify` | none (rate-limited) |
| GET | `/api/v1/users/me` | user or admin |
| PATCH | `/api/v1/users/me` | user or admin |
| GET | `/api/v1/users` | admin |
| POST | `/api/v1/users/:id/kyc` | admin |
| GET | `/api/v1/chit-groups` | none (public read) |
| GET | `/api/v1/chit-groups/:id` | none (public read) |
| POST | `/api/v1/chit-groups` | admin |
| POST | `/api/v1/chit-groups/:id/close` | admin |
| POST | `/api/v1/chit-groups/:groupId/join` | user or admin |
| GET | `/api/v1/subscriptions/mine` | user or admin |
| GET | `/api/v1/subscriptions/:id/installments` | owner or admin |
| GET | `/api/v1/subscriptions/:id/dividends` | owner or admin |
| POST | `/api/v1/chit-groups/:groupId/auctions` | admin |
| GET | `/api/v1/chit-groups/:groupId/auctions` | none (public read) |
| GET | `/api/v1/auctions/:id` | none (public read) |
| POST | `/api/v1/auctions/:id/start` | admin |
| POST | `/api/v1/auctions/:id/bid` | user or admin (rate-limited) |
| POST | `/api/v1/auctions/:id/close` | admin |
| POST | `/api/v1/payments/order` | user or admin |
| POST | `/api/v1/payments/webhook` | Razorpay signature (no user auth) |
| GET | `/api/v1/payments/mine` | user or admin |
| GET | `/api/v1/admin/dashboard` | admin |
| GET | `/api/v1/admin/ledger` | admin |
| GET | `/api/v1/admin/auctions` | admin |
| GET | `/api/v1/admin/subscribers` | admin |

**Socket.IO events** (namespace `/`, default):
- Client → server: `join_auction { auctionId, token? }`, `leave_auction { auctionId }`
- Server → client (room `auction:<id>`): `bid_placed`, `auction_closed`
- Server → client (ack): `joined_auction`

## Explicitly out of scope for this MVP

AML/PMLA reporting, DPDP consent ledger, GST computation, multi-state registrar rule variation,
provably-fair RNG, escrow account separation. `// TODO(compliance):` comments mark where these
would plug in later (see `src/migrations/001_init.sql`, `src/routes/auth.js`).

## Deploying to Railway

`railway.json` is included; it runs `npm run migrate && npm start` on deploy. Set all variables
from `.env.example` as Railway environment variables — do not commit real secrets.
