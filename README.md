# LittleBee — Monolithic Trading Platform (Node 24 + AdonisJS 6 + React)

One project, one `package.json`, one `npm install`, one Node process in
production. AdonisJS 6 (API, auth, MySQL, Coinremitter) and the React + Vite
frontend live in the same folder; the frontend builds into `public/`, which
AdonisJS serves directly.

## Requirements
- **Node.js 24.x**
- MySQL 8+ (or MariaDB 10.5+), reachable with the credentials you put in `.env`

## Setup
```bash
npm install          # installs everything, then postinstall creates .env
                      # with a fresh APP_KEY and a generated admin password
                      # (printed once to the console — copy it down)

# edit .env if your MySQL isn't at 127.0.0.1:3306 with user "littlebee"

npm run db:setup      # creates the database if needed, applies the schema,
                       # seeds starter settings/gateways, creates the admin
npm run dev            # API on http://localhost:3333, web app on http://localhost:5174
```
Open **http://localhost:5174** (or whatever port Vite prints — see note
below) and log in with the admin email/password from the `npm install`
output.

## Why these commands, and not `node ace ...`

This setup deliberately avoids `node ace generate:key`, `node ace
migration:run`, and `node ace db:seed`. On this project's original
dependency (`ts-node-maintained`) those failed on Node 24 with:
```
TypeError: loaderInstance.getMetaData is not a function
```
That's a real incompatibility, not a config mistake to work around one flag
at a time: Node 24 changed its module-loader-hook internals as part of
shipping native TypeScript support, and `ts-node-maintained`'s loader hook —
which every `node ace <command>` goes through, not just the three above —
hadn't caught up. (Node's own *native* TS support isn't a fallback option
either: it has **no support for decorators at all**, and this app's entire
Lucid model layer — `@column()`, `@belongsTo()`, etc. — depends on them.)

The fix was to drop `ts-node-maintained` for **[tsx](https://tsx.is)**
(esbuild-based, actively maintained, works with legacy decorators, and
`tsx watch` handles auto-restart natively — no AdonisJS-specific HMR/loader
machinery involved). More importantly, `db:setup` and the dev/start scripts
now run the app's entry files directly (`tsx bin/server.ts`,
`tsx scripts/db-setup.ts`) instead of going through `node ace`'s
command-loading system — the exact thing that was throwing. `ace.js` is
still there and updated to use `tsx` too, so `node ace <command>` works for
one-off scaffolding later (`make:controller`, etc.), but nothing in the
normal setup/run flow depends on it anymore.

**One thing I can't verify without actually running this on Node 24:**
whether `tsx` picks up `experimentalDecorators`/`emitDecoratorMetadata` from
`tsconfig.json` (which extends `@adonisjs/tsconfig`, where they're enabled)
automatically for every backend file. `tsx` is designed to respect the
nearest `tsconfig.json`, and esbuild's decorator support is exactly
config-driven this way, so this should work — but it's the one part of this
fix I'm inferring from tsx's documented behavior rather than something I
watched succeed. If `npm run dev` throws a decorator-related parse error,
that's where to look first, and tell me the exact error.

## Running

**Development** (auto-restart on backend changes, HMR on the frontend):
```bash
npm run dev
```
- Frontend (Vite, HMR): **http://localhost:5174**
- API (tsx watch, restarts on file change): http://localhost:3333 — Vite proxies `/api` and `/uploads` here, so the frontend never needs a separate API URL configured.

**Single process** (what a real deploy looks like):
```bash
npm run build     # builds the React app into public/
npm start         # AdonisJS serves API + frontend on http://localhost:3333
```
Client-side routes (`/app/wallet`, `/admin/users`, …) are handled by a
GET-only SPA fallback at the end of `start/routes.ts` that returns
`public/index.html`. Real files under `public/` (built assets, uploads) are
served by `@adonisjs/static` before routing.

Keep the auto SL/TP/liquidation closer running on an interval (cron/pm2).
This one still goes through `node ace` (`node ace sweep:trades`) — unlike
setup, it's not something you run interactively while getting the app
working, and it needs the full app/database boot that only `.ace()`
provides (rewriting that boot path outside of ace wasn't worth the risk of
introducing a new bug for a cron job you won't touch until you deploy). It
should work now since `ace.js` was updated to use `tsx` — if it still throws
`getMetaData`, that's a genuinely different problem from the one this README
describes fixing, and worth reporting with the exact error.

## Layout
```
app/ config/ database/ start/ bin/ commands/ scripts/   AdonisJS backend + setup scripts
src/ index.html vite.config.ts tailwind.config.js         React frontend
public/            build output (index.html, assets/) + uploads/ (user files)
tsconfig.json           backend types      tsconfig.frontend.json   frontend types
```
`npm run typecheck:backend` / `npm run typecheck:frontend` (plain `tsc`, unaffected by any of the above).

## Trade-outcome integrity
No endpoint, controller, or admin route can set or influence a trade's
outcome. Trades open/close only via `TradeExecutionService` at prices from
`PriceFeedService`; PnL is computed from real entry/exit prices. The admin
open-positions view is read-only. Admins can only approve/decline
deposits/withdrawals, review KYC, manage users/gateways/settings, and make
audited wallet adjustments.

## Admin
Standard `/api/v1/admin/*` (auth + role middleware) and `/admin` in the UI
(role-checked). No path obfuscation.

## Coinremitter
`app/services/coinremitter_service.ts`; webhook at
`POST /api/webhooks/coinremitter` (verified via verify-ipn, idempotent on
txid). Live withdrawals need admin approval before the payout call. Verify
endpoint field names against Coinremitter's current docs before going live.
Set per-coin keys in `.env`.

## Notes / known limits
- Stocks/forex quotes need `STOCKS_FX_API_KEY` (Twelve Data); crypto works keyless via CoinGecko.
- Password reset by email and an economic-calendar feed are not implemented (no mailer/provider configured).
- Files upload to `public/uploads` on local disk; swap for S3/R2 for multi-server deploys.
- `npm run db:setup` is safe to re-run (tables use `IF NOT EXISTS`, settings/gateways upsert, the admin is only created once).
- If you ever compile for production via `node ace build`, the `imports` map in `package.json` needs to point at `.js` instead of `.ts` for the build output — it's set to `.ts` for the direct-`tsx` flow this README describes.
- Not yet verified by a full run in the authoring environment (no network there) — report any error text and it'll be fixed.
# littlebee
