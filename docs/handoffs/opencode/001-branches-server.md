# 001 — Full branches on the server (Change 9)

Status: cancelled on 2026-11-05 · replaced by `docs/handoffs/gemini/018-branches-full-stack.md` (the user gave branches to Gemini as a full-stack task). The unfinished attempt (did not compile) was deleted on 2026-11-07 when the repo was cleaned to a single `main`.

## Why
The client wants one owner with many branches. The server already has a `stores` table and a
`storeId` on every stock and money row (ADR 0023), but everything resolves to the single store
through `StoresService.currentStoreId()`. This task makes more than one store real. Server only.

=== MESSAGE ===
Build full multi-store ("branches") on the server. Server only: `server/**` and docs. Do not ask questions; where something is open, take the simplest correct option and write it in the ADR.

First:
- Read `CLAUDE.md` and every file in `.agent/rules/`. They are binding (module anatomy controller/service/repository, no enums, derive don't duplicate, files ≤300 lines, schema files ≤150 lines, ADR ≤40 lines, README ≤40 lines).
- Read `docs/plan/store-balance.md` section "Change 9 — many branches", `docs/decisions/0023*.md`, 0024, 0030, 0036, and `server/src/stores/README.md`, `ledger/README.md`, `stock/README.md`, `shifts/README.md`, `settings/README.md`, `sync/README.md`, `access/README.md`.
- You are in a git worktree on branch `agent/opencode/branches-server`. Never commit to `main`, never push. A dev server runs on port 3000: never stop it; use `PORT=3120` for your own. The dev database is shared: additive migrations only, never reset it, never edit an applied migration. If `prisma migrate dev` reports drift, stop and use your own database (`createdb mobile_erp_branches`, point `DATABASE_URL` at it in your shell only).

What to build:
1. **Stores resource** (`/stores`, new permission `store.manage`): list, create, rename/edit, deactivate (`deactivatedAt`; a store with stock or an open shift cannot be deactivated). Creating a store creates its cash and card accounts and its settings row the same way the first store got them.
2. **Users per store**: a join table user ↔ store. A user sees and works only in their stores. A new permission `store.all` (owner/admin) means every store. `GET /auth/me` and the login response gain `stores: [{id,name}]`.
3. **The active store per request**: header `X-Store-Id`. `StoresService.currentStoreId()` becomes request-scoped: the header value if the caller may use that store, else 403 `STORE_FORBIDDEN`; no header and exactly one allowed store means that store; no header and several means 400 `STORE_REQUIRED`. Every existing create path already calls `currentStoreId()`; keep that single resolution point. Offline sync replays carry the store they were made in.
4. **Reads are scoped**: every list, detail and report returns only the active store's rows (devices, stock, shipments, sales, expenses, ledger and balances, credits, shifts, purchases, repairs, catalog). Find every repository query on a store-scoped table and add the store filter; a detail of another store's row is 404. Customers, partners, suppliers, products (models), price lists and price levels stay shared across stores.
5. **All-stores view** for `store.all` callers: `X-Store-Id: all` is accepted on read-only report and balance endpoints only (company totals, and a per-store breakdown on the balance summary); writes with `all` are 400.
6. **Stock transfer between stores** (new module, e.g. `server/src/stock-transfers/`, permissions `transfer.create`, `transfer.receive`, `transfer.read`): a document from store A to store B with lines that are either units (by device id) or quantities of a quantity product. Sending takes the goods out of A (units get an "in transit" status with a history row; quantities post a stock movement out, cost frozen). Receiving in B puts them into B (units change store and return to their previous sellable status; quantities post a movement in at the same frozen cost). A transfer can be cancelled before it is received (goods return to A). No money moves. Units in transit cannot be sold, consigned or transferred again.
7. **Settings per store** already exist as a row per store: make `GET/PUT /settings` act on the active store.
8. Telegram daily digest: one message per store, or one message with a block per store (simplest).
9. Seed: a second demo store "Branch 2" with its accounts, so clients can be tested.

Checks (run them, paste the output in the Result):
- `cd server && pnpm build && pnpm test && pnpm lint`. All existing tests must still pass; add tests next to new files: store scoping (a user of store A cannot read or write store B), the header rules, a unit transfer and a quantity transfer end to end, cancel, the in-transit sale refusal, deactivation rules.
- Migration: `pnpm prisma migrate dev --name branches`; update `prisma/seed.sql`; run the seed.
- A live walk-through on your own server with hand arithmetic: two stores; a sale in each; balances are separate and the `all` view is their sum; transfer 1 phone and 5 cables from A to B; stock and stock value before and after in both.
- Docs in the same change: `docs/decisions/0045-branches.md` (≤40 lines; 0043 and 0044 are taken), `server/src/stores/README.md`, the new module's README, and every module README whose contract changed.
- `graphify update .` in `server/` then at the repo root (skip if the command is missing; say so).
- Commit on your branch, adding files by path (never `git add -A`, never `.env`). Do not merge, do not push.

Do not: edit `client/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`; add an enum; store a balance or a stock count; write Uzbek.

Fill the Result section of `docs/handoffs/opencode/001-branches-server.md` and set Status to done. Report only what you ran.
=== END ===

## Result (OpenCode fills)
- Branch / commit:
- Migration name:
- Tests (suites / tests, before → after):
- Walk-through numbers:
- Decisions taken:
- **Client contract** (every new or changed route with request and response shapes, the header rules, new permissions, new status and movement codes, new error codes), precise enough to build the web and phone apps from:
- Not done / skipped / failed:

## Check by Claude
