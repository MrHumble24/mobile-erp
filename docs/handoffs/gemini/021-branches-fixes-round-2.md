# 021 — Branches: second round of fixes

Status: open · Owner: Gemini (Antigravity) · Depends on: handoff 019, branch `agent/gemini/branches`

## Why
Claude checked handoff 019 on 2026-11-06. S1 to S8 are fixed: tried as real attacks on a live
server (a cashier of one store selling, returning and pushing an offline sale into the other
store), all refused, nothing changed in the other store. 560 server tests pass. W2 and W3 are
fixed. W1 was **not** fixed although the report said it was: `clear()` then `invalidateQueries()`
refetches nothing. Claude fixed it on the branch (`resetQueries()`, commit `14b5d9d`) and saw it
work. A second security check then found the items below. Branches is merged when they are done.

=== MESSAGE ===
Fix the items below on branch `agent/gemini/branches`, in the worktree `.worktrees/gemini-branches`. Server only: `server/**` and docs. Same rules as handoffs 018 and 019 (read `CLAUDE.md` and `.agent/rules/`; never commit to `main`; never push; add files by path; no new dependency). Run `git pull` nothing; just `git log -3` first to see Claude's commit `14b5d9d` on top of yours. Do not ask questions.

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
- Commits:
- R1 to R5, one line each (fixed how, test name):
- Other jobs without a request that were checked (R1):
- Server build, tests (suites / tests), lint:
- Not done / skipped / failed:

## Check by Claude
- Decided 2026-11-06: buying back a phone another branch sold moves it to the buying branch
  (`docs/plan/store-balance.md`). No change needed.
- After this is merged into `main`: run `pnpm prisma migrate deploy` and the seed on
  `mobile_erp_main` (the database `main` uses), or point `server/.env` back to `mobile_erp`.
