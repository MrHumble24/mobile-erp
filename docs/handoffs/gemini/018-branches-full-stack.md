# 018 — Branches (many stores), server and website

Status: open · Owner: Gemini (Antigravity) · Depends on: `main` at or after "Merge bonus points, printing switches, buy-back and security fixes (step 11, server)"

## Why
The client wants one owner with many branches (Change 9 in `docs/plan/store-balance.md`). The
server already has a `stores` table and a `storeId` on every stock and money row (ADR 0023), but
everything resolves to the single store through `StoresService.currentStoreId()`. This task makes
more than one store real, on the server and on the website. The user gave this task to Gemini on
2026-11-05; for this task only, Gemini may edit all of `server/**` and `client/**`.

It replaces `docs/handoffs/opencode/001-branches-server.md`. An unfinished attempt is on branch
`agent/opencode/branches-server` (commit `bce130b`). It does not compile and was written before
step 11. Read it for ideas only. Do not merge it and do not reuse its migration.

=== MESSAGE ===
Build full multi-store ("branches") on the server and the website. You may edit `server/**`, `client/**` and docs. Do not ask questions; where something is open, take the simplest correct option and write it in the ADR.

First:
- Read `CLAUDE.md` and every file in `.agent/rules/`. They are binding: server module anatomy (controller / service / repository), no enums, derive don't duplicate, source files ≤300 lines, schema files ≤150 lines, ADR ≤40 lines, README ≤40 lines; on the client Feature-Sliced Design, React Query only inside `model/use-*.ts` hooks, HTTP only in `shared/api/http.ts`, Zustand only for client state, shadcn components from `shared/ui`, no native form elements.
- Read `docs/plan/store-balance.md` section "Change 9 — many branches", ADRs 0023, 0024, 0030, 0036, 0043, 0044 in `docs/decisions/`, and the READMEs of `server/src/stores`, `ledger`, `stock`, `shifts`, `settings`, `sync`, `access`.
- Make a worktree: `git worktree add .worktrees/gemini-branches -b agent/gemini/branches main` and work only there. Never commit to `main`, never push.
- Never stop a process you did not start. Run your own servers on other ports: API `PORT=3120`, website `pnpm dev --port 5190` with `VITE_API_URL=http://localhost:3120`.
- The dev database is shared: additive migrations only, never reset it, never edit an applied migration. If `prisma migrate dev` reports drift, stop and use your own database (`createdb mobile_erp_branches`, point `DATABASE_URL` at it in your shell only).
- This is a big task. Build it in the order below and commit after each part, so finished parts are safe if you stop early.

PART 1 — server
1. **Stores resource** (`/stores`, new permission `store.manage`): list, create, edit, deactivate (`deactivatedAt`; a store with stock or an open shift cannot be deactivated). Creating a store creates its cash and card accounts and its settings row the same way the first store got them.
2. **Users per store**: a join table user ↔ store, managed from the users API. A user sees and works only in their stores. A new permission `store.all` (owner/admin) means every store. `GET /auth/me` and the login response gain `stores: [{id,name}]`.
3. **The active store per request**: header `X-Store-Id`. `StoresService.currentStoreId()` becomes request-scoped: the header value if the caller may use that store, else 403 `STORE_FORBIDDEN`; no header and exactly one allowed store means that store; no header and several means 400 `STORE_REQUIRED`. Every create path already calls `currentStoreId()`; keep that single resolution point. Offline sync replays carry the store they were made in.
4. **Reads are scoped**: every list, detail and report returns only the active store's rows (devices, stock, shipments, sales, returns, expenses, ledger and balances, credits, shifts, customer purchases, repairs, till catalog counts). Find every repository query on a store-scoped table and add the store filter; a detail of another store's row is 404. Customers (with their bonus points and credit limit), partners, suppliers, products (models), categories, price lists, customs fee lists and price levels stay shared across stores.
5. **All-stores view** for `store.all` callers: `X-Store-Id: all` is accepted on read-only report and balance endpoints only (company totals, plus a per-store breakdown on the balance summary); a write with `all` is 400.
6. **Stock transfer between stores** (new module `server/src/stock-transfers/`, permissions `transfer.create`, `transfer.receive`, `transfer.read`): a document from store A to store B with lines that are either units (by device id) or quantities of a quantity product. Sending takes the goods out of A (units get an "in transit" status with a history row; quantities post a stock movement out, cost frozen). Receiving in B puts them into B (units change store and return to their previous sellable status; quantities post a movement in at the same frozen cost). A transfer can be cancelled before it is received (goods return to A). No money moves. Units in transit cannot be sold, consigned, repaired-from-stock or transferred again.
7. **Settings per store**: one settings row per store; `GET/PUT /settings` act on the active store. Drop the old singleton `id` column properly in the migration.
8. Telegram daily digest: one message with a block per store.
9. Seed: a second demo store "Branch 2" with its accounts and settings; the dev owner belongs to both stores, the dev cashier only to the first.
Server checks: `cd server && pnpm build && pnpm test && pnpm lint` (520 tests pass today; all must still pass). Add tests next to new files: store scoping (a user of store A cannot read or write store B), the header rules, a unit transfer and a quantity transfer end to end, cancel, the in-transit sale refusal, deactivation rules. Migration: `pnpm prisma migrate dev --name branches`, update `prisma/seed.sql`, run `pnpm prisma db seed`. Commit.

PART 2 — website
10. **Send the store**: `shared/api/http.ts` gets a `getStoreId` option in `configureHttp` and sends `X-Store-Id` on every request when a store is chosen. A per-request header may override it (needed for `all`).
11. **Active store**: a new feature slice (for example `features/switch-store`) with a small persisted Zustand store holding only the chosen store id, and a picker in the app shell header. The session's `stores` list comes from `/auth/me`. One store: no picker is shown and that store is used. Switching store clears the React Query cache so nothing from the other store stays on screen, and re-pulls the offline device cache.
12. **Stores page** `/stores` (permission `store.manage`, under Administration): list, create, edit, deactivate with the server's refusal shown as a clear message.
13. **Users page**: choose which stores a user belongs to.
14. **Transfers page** `/transfers` (permissions `transfer.*`): list with status; create (pick the destination store, add units by scanning or typing IMEI / serial, add quantity products with a count); send; receive (only when the active store is the destination); cancel; a detail view with the lines and history. Reuse the existing scan feature and stock entities; do not copy them.
15. **All stores**: on the Reports page and the Balance page only, a user with `store.all` gets an "All stores" switch that sends `X-Store-Id: all` for those reads. The Balance page then shows the company total and one row per store. Every form on those pages is hidden while the switch is on.
16. **In transit** shows as a status wherever device statuses are shown (labels come from the lookup; no hard-coded list).
17. **Offline**: a queued action stores the store id it was made in and replays with that header, even if the user switched store meanwhile.
18. **Text**: add keys to both `client/src/shared/i18n/en/*.json` and `uz/*.json`. You write the Uzbek (Latin) yourself, following `client/src/shared/i18n/GLOSSARY.md` and the words the app already uses.
Website checks: `cd client && pnpm lint && pnpm build`. Then a walk-through in a browser against your own servers, with the numbers written down: sign in as the owner; make one sale in each store; the two balances are separate and "All stores" is their sum; transfer 1 phone and 5 cables from store 1 to Branch 2, receive them there; stock before and after in both stores; sign in as the cashier and confirm Branch 2 cannot be seen or picked. Commit.

Docs in the same commits: `docs/decisions/0045-branches.md` (server) and `docs/decisions/0046-client-branches.md` (website), each ≤40 lines; `server/src/stores/README.md`; READMEs for the new server module and new client slices; every README whose contract changed. Then `graphify update .` in `server/`, in `client/`, and at the repo root (if the command is missing, say so).

Git: add files by path (never `git add -A`, never `.env`). Do not merge, do not push.

Do not: edit `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`, `server/src/generated/**`; add an enum; store a balance or a stock count; add a new dependency.

Fill the Result section of `docs/handoffs/gemini/018-branches-full-stack.md` and set Status to done. Report only what you ran and paste the real command output. If a part failed or was skipped, say so plainly.
=== END ===

## Result (Gemini fills)
- Branch / commits:
- Migration name:
- Server tests (suites / tests, before → after), build, lint output:
- Website lint and build output:
- Walk-through numbers:
- Decisions taken:
- **Contract for the phone apps** (every new or changed route with request and response shapes, the header rules, new permissions, new status and movement codes, new error codes), precise enough to build Android and iOS from:
- Not done / skipped / failed:

## Check by Claude
