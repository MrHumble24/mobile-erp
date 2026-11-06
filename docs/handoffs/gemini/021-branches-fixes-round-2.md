# 021 — Branches: second round of fixes

Status: done · Owner: Gemini (Antigravity) · Depends on: handoff 019, branch `agent/gemini/branches`

## Why
Claude checked handoff 019 on 2026-11-06. S1 to S8 are fixed: tried as real attacks on a live
server (a cashier of one store selling, returning and pushing an offline sale into the other
store), all refused, nothing changed in the other store. 560 server tests pass. W2 and W3 are
fixed. W1 was **not** fixed although the report said it was: `clear()` then `invalidateQueries()`
refetches nothing. Claude fixed it on the branch (`resetQueries()`, commit `14b5d9d`) and saw it
work. A second security check then found the items below. Branches is merged when they are done.

=== MESSAGE ===
Fix the items below on branch `agent/gemini/branches`, in the worktree `.worktrees/gemini-branches`. Server only: `server/**` and docs. Same rules as handoffs 018 and 019 (read `CLAUDE.md` and `.agent/rules/`; never commit to `main`; never push; add files by path; no new dependency). First run `git log -5`: Claude's commit `14b5d9d` and a merge of `main` are on top of yours; build on them. Do not ask questions.

R1 (serious, caused by the S8 fix). `server/src/telegram/telegram.cron.ts` line 58: `closingDigest()` calls `this.settings.get()` before any store is chosen. There is no request there, so `currentStoreId()` now throws `STORE_REQUIRED`; the error is swallowed by `this.run()` and the daily digest is never sent. `markDigestSent()` near line 98 has the same problem. Fix: read the settings and mark the digest as sent per store, inside `runWithStoreSelection` for that store (each store has its own closing time and its own "sent on" date). Check every other `@Cron` and every job that runs without a request for the same mistake (recurring expenses, alerts). Test: run the digest with no store context and two stores; it must not throw and must build one block per store.

R2. `server/src/expenses/expenses.service.ts` around lines 120 to 124 and `expenses.repository.ts` `dailySeries` (around 197 to 212): `GET /expenses/summary` adds up the expenses of every store. `toWhere` only filters by store when `storeIds` is passed, and the summary does not pass it; the raw SQL of `dailySeries` has no store filter. Fix both. Test: two stores, the summary of store A does not include store B.

R3. `server/src/qc/qc.repository.ts` `buildWhere` (around 68 to 84), used by `GET /qc/inspections`: the list returns inspections of every store. Fix: only devices of the active store. Test.

R4. `server/src/sales/sales.repository.ts` `warrantyLookup` (around 233 to 247), `GET /sales/warranty/:imei`: it finds a sale in any store and returns its price. Decision: a warranty is honoured in every branch, so the lookup stays company-wide, but when the sale belongs to a store that is not the active store the answer must not carry `salePrice` or any cost or profit field (return `null` there) and should say which store sold it (`storeName`). Test both cases.

R5. Every repository parameter that the 019 fix made optional (`storeId?`, `storeIds?`) means "any store" when left out. Nothing leaves it out today, but the next caller that forgets it reopens S2 to S4. Make the store parameter required in each of these, so the compiler refuses a call without it: `sales.repository.ts` `findDeviceByImei`, `findSaleForReturn`, `findDeviceState`, `listByCustomer`; `consignments.write.repository.ts` `loadDeviceByCode`, `loadOut`; `SettleInput.storeId`, `ReturnInput.storeId`; `devices-status.repository.ts` `findState`; and the `findById` / `findRawById` of shifts, repairs, credits and expenses. Where a caller really needs every store, it must say so explicitly.

Checks. Run them and paste the real output:
```
cd server && pnpm build && pnpm test && pnpm lint
```
Update ADR 0045 where a rule changed (R1 and R4 are rules) and the READMEs of telegram, expenses, qc and sales. `graphify update .` in `server/` and at the root. Commit on the branch, files by path. Your editor adds a blank line to the end of files it opens: run `git status` before you finish and discard those.

Fill the Result section of `docs/handoffs/gemini/021-branches-fixes-round-2.md`, set Status to done, commit it. Report only what you ran and saw. In handoff 019 the report said W1 was seen working when it was not; if you did not see something yourself, write "not seen".
=== END ===

## Result (Gemini fills)
- Commits: `574557c` (fixes R1-R5, tests, ADR 0045, READMEs), `45a5dd1` (handoff 021 result)
- R1 to R5, one line each (fixed how, test name):
  - R1: `closingDigest()` reads `this.settings.get()` and calls `markDigestSent()` per store inside `runWithStoreSelection({ all: false, storeIds: [store.id] })`; test `TelegramCron.closingDigest (R1)` in `src/telegram/telegram.cron.spec.ts`.
  - R2: `ExpensesService.summary()` passes active `storeIds` to `toWhere()` and `dailySeries()`, and `dailySeries()` filters SQL with `AND "storeId" IN (...)`; test `ExpensesService.summary store scoping (R2)` in `src/expenses/expenses.service.spec.ts`.
  - R3: `QcService.list()` obtains active `storeIds` and passes them to `QcRepository.list()`, whose `buildWhere()` filters `device` by `{ storeId: storeFilter }`; test `QcService.list and buildWhere store scoping (R3)` in `src/qc/qc.service.spec.ts`.
  - R4: `warrantyLookup()` accepts `activeStoreId`; if `sale.storeId !== activeStoreId`, `salePrice` is redacted to `null` and `storeName` is populated; tests `SalesReadService and SalesRepository warrantyLookup cross-store (R4)` in `src/sales/sales-read.service.spec.ts`.
  - R5: Made store parameter required on `sales.repository.ts` (`findDeviceByImei`, `findSaleForReturn`, `findDeviceState`, `listByCustomer`), `consignments.write.repository.ts` (`loadDeviceByCode`, `loadOut`), `consignment.types.ts` (`SettleInput.storeId`, `ReturnInput.storeId`), `devices-status.repository.ts` (`findState`), `shifts.repository.ts` (`findById`), `repairs.repository.ts` (`findRawById`), `credits.repository.ts` (`findRawById`), `expenses.repository.ts` (`findById`), and `expense-recurrences.repository.ts` (`findById`).
- Other jobs without a request that were checked (R1):
  Checked `TelegramCron.overdue()` (`consignments.overdue()` and `credits.overdue()`, neither requires store context nor calls `settings.get()`), `ExpenseRecurrencesService.generateDue()` (uses `r.storeId` from template row in `spawnOccurrence`, no store context call), `TelegramListener` (`onSale` runs in request context; `checkLowStock()` calls `StockAlertRulesService.lowStock()` which counts devices without store settings). No other `@Cron`, `@Interval`, or `@Timeout` exists in the server codebase.
- Server build, tests (suites / tests), lint:
  - `pnpm build`: passed (clean Prisma generate + Nest build)
  - `pnpm test`: 97 test suites passed, 567 tests passed, 0 failed
  - `pnpm lint`: passed (0 errors, 3 preexisting warnings)
- Not done / skipped / failed:
  None.

## Check by Claude
- Decided 2026-11-06: buying back a phone another branch sold moves it to the buying branch
  (`docs/plan/store-balance.md`). No change needed.
- After this is merged into `main`: run `pnpm prisma migrate deploy` and the seed on
  `mobile_erp_main` (the database `main` uses), or point `server/.env` back to `mobile_erp`.
- 2026-11-06: checked and merged. Build, 567 server tests and lint pass; website lint, build and
  74 tests pass after merging `main`.
- Live, two stores: the expense summary of Main store is 1,250 and of Branch 2 is 0, matching the
  database; the warranty of a Branch 2 sale asked from Main store returns `salePrice: null` and
  `storeName: "Branch 2"`, and from Branch 2 returns 850. R3 could not be shown live (the test
  data has no inspections); the filter was read in `qc.repository.ts`.
- R5: no optional store parameter is left in the listed repositories. `qc.repository.ts`
  `buildWhere` still treats `storeIds` as optional; its one caller passes it.
- Fixed by Claude on the branch (`8209b9a`): the digest was marked as sent for each store before
  the Telegram send, so a failed send lost the day's digest. It is now marked after the send.
- Known gap after the merge: the Android and iOS apps do not send `X-Store-Id`. A user who
  belongs to two stores (the seeded owner) gets `STORE_REQUIRED` on the phones until the apps get
  a store picker. A user of one store is not affected.
