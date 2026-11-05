# 019 — Branches: fixes after Claude's check of 018

Status: open · Owner: Gemini (Antigravity) · Depends on: handoff 018, branch `agent/gemini/branches`

## Why
Claude checked handoff 018 on 2026-11-06: build, 540 tests and lint pass; the header rules, the
"all stores" sum and reading another store's row (404) were confirmed on a live server. But a
security check and a browser check found the problems below. 018 is not merged until they are fixed.

Already done by Claude on the branch: `X-Store-Id` was missing from the CORS `allowedHeaders` in
`server/src/main.ts`, so no browser could reach the server. Fixed and committed. This means the
website was never seen working against the server; the 018 walk-through was done through the API.

=== MESSAGE ===
Fix the problems below on branch `agent/gemini/branches`, in the worktree `.worktrees/gemini-branches`. Same rules as handoff 018 (read `CLAUDE.md` and `.agent/rules/`; never commit to `main`; never push; add files by path; no new dependency). The database for this branch is `mobile_erp`; `main` uses a different one now, so you may migrate `mobile_erp` freely. Do not ask questions.

The common cause of S1 to S6: a write path looks a row up by id or by IMEI **without** the active store. Reads were scoped; these writes were not. After fixing the ones listed, search every repository for `findUnique`, `findFirst`, `update`, `delete` on a store-scoped table and prove to yourself each one is filtered by the active store. List in the Result every extra place you fixed.

SERVER — security (each fix needs a test next to it that fails before the fix)
S1 (critical). `server/src/sync/sync.service.ts` around line 76: a replayed offline mutation runs in `mutation.storeId` exactly as the client sent it. A cashier of store 1 can push a sale into store 2. Fix: the store must be one of the caller's allowed stores (`StoresService` already knows them), else reject that mutation with `STORE_FORBIDDEN`. Make `storeId` a UUID in `sync/dto/push.dto.ts`. A mutation with no `storeId` from a user with several stores is rejected with `STORE_REQUIRED`.
S2. `server/src/sales/sales.repository.ts` `findDeviceByImei` (around line 165), used by checkout: it finds a phone in any store. A store 1 cashier can sell a phone that is in store 2. Fix: only a unit of the active store; otherwise the same "not found" answer as an unknown IMEI.
S3. `sales.repository.ts` `findSaleForReturn` and `findDeviceState` (around lines 214 to 248), used by `sales-returns.service.ts`: a return works on any store's sale and takes the refund out of that store's cash. Fix: the sale must belong to the active store, else 404.
S4. `server/src/consignments/consignments.write.repository.ts` `loadDeviceByCode` and `loadOut` (around lines 103 to 129): create, settle and return-to-stock work on another store's unit or document. Fix: active store only, else 404.
S5. `server/src/stock-transfers/`: receive and cancel check the status before the transaction and then update without a condition (`stock-transfers.service.ts` 91 to 145, `lib/transfer-execution.ts` 160 to 216, and the send at line 69). Two receives at the same moment, or a receive and a cancel, both run: stock is added twice. Fix inside the transaction: `updateMany({ where: { id, status: 'SENT' }, ... })` and stop if `count === 0`; on send, `updateMany` on the device with `statusCode: 'IN_STOCK'` and stop if `count === 0`.
S6. `stock-transfers.service.ts` `get` (line 38): the detail of any transfer can be read by id. Fix: only when the source or the target is one of the caller's stores, else 404.
S7. `sales.repository.ts` `listByCustomer` (line 97), shown on the customer page: it returns the customer's sales from every store with prices and cost. Fix: only the active store's sales.
S8. `stores.service.ts` around line 122: with no store selected, `currentStoreId()` silently takes the first store. Fix: throw `STORE_REQUIRED`. Jobs that run without a request (Telegram digest) must keep choosing their store explicitly, as they do now.

WEBSITE — seen in a browser
W1. `client/src/features/switch-store/model/store.store.ts`: after a store switch the open page keeps the old store's data (inventory still showed 39 units after switching to a store with 6). `qc.clear()` does not refetch mounted queries. Use `resetQueries()` (or clear then invalidate) so the visible page reloads.
W2. `client/src/pages/balance/ui/StoreBreakdownTable.tsx` lines 30 to 32: it looks for accounts `"cash"` and `"bank"`; the codes are `CASH` and `CARD`, so both columns show $0. Do not hard-code account codes: build the columns from the accounts the server returns.
W3. `client/src/pages/stores/ui/StoresPage.tsx` line 86 uses `common.created`, which does not exist; the page shows the raw key. Add the key (en and uz) or use an existing one.
W4. `client/src/shared/api/http.ts`: the "all stores" override is a module-level variable (`storeOverride`). Remove it; pass the header per request only (the balance repository already does).

Then really use the website in a browser. Start your API with `CORS_ORIGINS=http://localhost:5190 PORT=3120` and the website with `VITE_API_URL=http://localhost:3120 pnpm dev --port 5190`. Do each of these and write what you saw:
- Switch store on the Inventory page: the list changes without leaving the page.
- Balance page, "All stores": each store's row shows its cash and card amounts and they add up to the totals.
- Create a transfer of 1 phone and 2 cables from Main store to Branch 2, switch to Branch 2, receive it. Then create another and cancel it.
- Users page: give the cashier Branch 2, sign in as the cashier, see the picker; take it away again.
- Offline: stop the API, make a sale in Main store, switch to Branch 2, start the API. The sale must land in Main store.

Checks: `cd server && pnpm build && pnpm test && pnpm lint`; `cd client && pnpm lint && pnpm build`. Update ADR 0045 / 0046 and the READMEs where a rule changed. `graphify update .` in `server/`, `client/` and the root. Commit on the branch, files by path. Your editor adds a blank line to the end of files it opens: run `git status` before you finish and discard those.

Fill the Result section below and set Status to done. Report only what you ran; paste the real output. If a point was not fixed, say so.
=== END ===

## Result (Gemini fills)
- Commits:
- S1 to S8, one line each (fixed how, test name):
- Extra unscoped places found and fixed:
- W1 to W4, one line each:
- Browser walk-through, what was seen at each step:
- Server tests (suites / tests), build, lint; website lint, build:
- Not done / skipped / failed:

## Check by Claude
- 2026-11-06, before this handoff: confirmed on a live server that reads are scoped and the header
  rules hold. Not yet checked: transfers through the website, users per store, offline replay.
- Open product question, not part of this handoff: buying back a phone that another store sold
  moves it into the buying store (`customer-purchases.write.repository.ts` 97 to 111). Probably
  wanted. Ask the user.
