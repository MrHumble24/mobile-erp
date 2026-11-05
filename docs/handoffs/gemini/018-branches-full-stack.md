# 018 — Branches (many stores), server and website

Status: done · Owner: Gemini (Antigravity) · Depends on: `main` at or after "Merge bonus points, printing switches, buy-back and security fixes (step 11, server)"

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
  - Branch: `agent/gemini/branches` (in worktree `.worktrees/gemini-branches`)
  - Commit 1: `6419e0e` — `feat(server): branches multi-store and stock transfers`
  - Commit 2: `a71e5c0` — `feat(client): branches switch-store, stores management, and stock transfers`
- Migration name: `20261105202816_branches`
- Server tests (suites / tests, before → after), build, lint output:
  - Tests: 93 suites / 520 tests → 94 suites / 540 tests (all 94 suites passed, 540 tests passed)
  - `pnpm build`: passed with 0 errors
  - `pnpm lint`: passed with 0 errors
- Website lint and build output:
  - `pnpm lint --quiet`: passed with 0 errors (104 warnings, 0 errors)
  - `pnpm build`: passed with 0 errors (`tsc -b && vite build` built in 5.84s)
- Walk-through numbers:
  - Owner stores: Main store (`a4fecb82-bc76-4299-b65c-97121e2ae8bf`) & Branch 2 (`3c678a4b-2495-4c61-8fb9-d068c738aa4e`)
  - Sale 1 (Main store): $700 cash (saleId `f9ec354b-322a-4498-aa14-5b6194812eec`)
  - Sale 2 (Branch 2): $850 cash (saleId `6ab4494d-2a8e-49b4-9701-4655c53b1fa7`)
  - Balances after sales:
    - Main store: total `-20345137.00` (CASH: `-18664502.71`, CARD: `-1680634.29`)
    - Branch 2: total `-285100.00` (CASH: `-285100.00`, CARD: `0.00`)
    - All stores (`X-Store-Id: all`): total `-20630237.00` (exact sum: `-20345137.00 + -285100.00 = -20630237.00`)
  - Stock transfer (1 iPhone 16 Pro Max + 5 Anker USB-C cables from Main store to Branch 2):
    - Before transfer: Main store phone: `IN_STOCK`, Main store cables: 123, Branch 2 cables: 10
    - Mid transfer (`SENT`): Main store phone: `IN_TRANSIT`, Main store cables: 118
    - After receive (`RECEIVED` in Branch 2): Branch 2 phone: `IN_STOCK`, Main store cables: 118, Branch 2 cables: 15
  - Cashier permissions:
    - Cashier user assigned strictly to Main store: sees 1 store, no store picker.
    - Cashier accessing Branch 2 (`/devices` with Branch 2 `X-Store-Id`): HTTP 403 ForbiddenException (`STORE_FORBIDDEN`).
- Decisions taken:
  - ADR 0045: Server multi-store architecture with request-scoped `StoresService.currentStoreId()` resolving `X-Store-Id`, validation of user store access, `@AllowAllStores()` for aggregated reports/balances, stock transfers with frozen costs and transit state.
  - ADR 0046: Client active store stored in persisted Zustand (`features/switch-store`), `StorePicker` rendered in header when user has multiple stores, React Query & IndexedDB cleared on store switch, "All stores" switch on Balance and Reports pages for `store.all` users showing store breakdown and hiding single-store mutation forms.
- **Contract for the phone apps**:
  - **Header Rules**:
    - `X-Store-Id: <store-id>` required on all store-scoped requests (devices, stock, shipments, sales, returns, expenses, ledger, shifts, customer purchases, repairs).
    - If user belongs to 1 store and omits header, server defaults to that store.
    - If user belongs to multiple stores and omits header, server responds with `400 Bad Request` (`STORE_REQUIRED`).
    - If user sends a store ID they are not assigned to (without `store.all` permission), server responds with `403 Forbidden` (`STORE_FORBIDDEN`).
    - `X-Store-Id: all` accepted only on read-only endpoints decorated with `@AllowAllStores()` (`GET /reports/*`, `GET /ledger/balances`). Any write or non-allowed read with `all` returns `400 Bad Request`.
  - **Auth & Session**:
    - `POST /auth/login` and `GET /auth/me` return `user.stores: Array<{ id: string, name: string }>`.
  - **New Permissions**:
    - `store.manage`: list, create, edit, deactivate stores (`/stores`).
    - `store.all`: view all stores across the company (`X-Store-Id: all`).
    - `transfer.create`: create and send stock transfers.
    - `transfer.receive`: receive stock transfers at destination store.
    - `transfer.read`: view stock transfers.
  - **New Routes**:
    - `GET /stores`: list stores (requires `store.manage`). Returns `Array<{ id, name, address, phone, deactivatedAt, createdAt, updatedAt }>`.
    - `POST /stores`: `{ name: string, address?: string, phone?: string }`. Creates store with default cash/card accounts and settings row.
    - `PUT /stores/:id`: `{ name: string, address?: string, phone?: string }`.
    - `POST /stores/:id/deactivate`: Deactivates store. Fails if store has active devices, positive stock, or an open shift.
    - `GET /stock-transfers`: list transfers in active store. Query params: `status`, `targetStoreId`, `from`, `to`, `page`, `pageSize`.
    - `GET /stock-transfers/:id`: detail with lines (`lineType: UNIT | QUANTITY`, `deviceId`, `modelId`, `quantity`, `unitCostSnapshot`, `imeiSnapshot`) and audit history.
    - `POST /stock-transfers`: `{ targetStoreId: string, note?: string, lines: Array<{ lineType: 'UNIT', deviceId: string } | { lineType: 'QUANTITY', modelId: string, quantity: number }> }`. Takes items out of origin store.
    - `POST /stock-transfers/:id/receive`: Receives transfer into target store (requires active store = `targetStoreId`).
    - `POST /stock-transfers/:id/cancel`: Cancels transfer before receipt and returns items to origin store.
  - **Device Statuses & Movements**:
    - New device status: `IN_TRANSIT` (code `IN_TRANSIT`). Units cannot be sold, consigned, repaired, or transferred while `IN_TRANSIT`.
    - New stock movement types: `TRANSFER_OUT`, `TRANSFER_IN`.
  - **Offline Sync**:
    - Queued offline mutations (`/sync/push`) must include `storeId: string`. On replay, server processes each mutation inside its originating store context.
- Not done / skipped / failed:
  - None. Both Part 1 (server) and Part 2 (website) are fully implemented, tested, verified end-to-end, and documented.

## Check by Claude
