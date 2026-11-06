# 025 — Online storefront: fixes after Claude's check of 022

Status: done · Owner: Gemini (Antigravity) · Depends on: handoff 022, branch `agent/gemini/storefront`

## Why
Claude checked handoff 022 on 2026-11-06. What held up, tried on a live server as a stranger with
no sign-in: nothing leaks (no IMEI, serial, cost, unit id or 15-digit number in any public
answer); the stock shown equals the database (3 in stock, with 1 consigned and 14 sold left out);
with the storefront off every public route is 404 and `config` says only `{ enabled: false }`;
with prices off every price is `null`; an order reserves nothing; a bad phone number and an
unknown field are refused; `X-Store-Id` on a public call changes nothing; an order is seen only
in its pickup store, another store gets 404 on it; the status rules hold; a customer's name
typed as `Test <b>Buyer</b>` is shown as text on the staff page. A security audit found no
critical or serious problem. Build, 674 server tests, 88 website tests and lint pass after
merging `main`. The items below are what is left. 022 is merged when they are done.

Claude already merged `main` into the branch (commit `30b6750`; seven small clashes with the
backup work, both sides kept) and dropped 50 stray blank lines the editor had added.

=== MESSAGE ===
Fix the items below on branch `agent/gemini/storefront`, in the worktree `.worktrees/gemini-storefront`. Same rules as handoff 022. First run `git log -3`: a merge of `main` by Claude is on top of your work; build on it. Your database is still `mobile_erp_storefront`. Do not ask questions.

SERVER
F1. `pnpm test` now needs a database and writes to it. `server/src/storefront/storefront.leak.spec.ts` boots the whole app against the real database and inserts an order named "Leak Test Customer" on every run (seven such rows were in your database; one more appeared when Claude ran the tests). The project's `pnpm test` is fast and uses no database, and must stay so. Do both:
   - Move this test out of `pnpm test` into its own command (for example `pnpm test:storefront-leak`, like the existing `pnpm test:restore`), make it delete every row it created, and make it fail, not silently pass, when the seed has no product in stock (today the detail and order checks are skipped when the product list is empty).
   - Add a fast leak test inside `pnpm test` that needs no database: feed the real shaping functions (`lib/product-shaping.ts` and the config and order mappers) with realistic rows that DO contain an IMEI, a serial, every cost field, a supplier, a QC grade and a unit id, and assert none of them reaches the output.
   - Put the `test` script in `server/package.json` back to plain `jest` if the `--experimental-vm-modules` option was only needed for the test you moved; keep `server/test/stubs/event-emitter.ts` only if something still needs it. Say what you did.
F2 (audit M1). The order limit is not per visitor in production. The throttler keys on `req.ip`, and behind Railway's proxy that is the proxy's address, so the whole internet shares one bucket of 5 orders a minute: one customer can lock everyone out. Simply trusting `X-Forwarded-For` would let anyone bypass the limit. Fix: read the number of trusted proxy hops from one setting (env `TRUST_PROXY_HOPS`, default 0 for local use, documented as 1 for Railway), call `app.set('trust proxy', hops)` in `main.ts`, and make sure the throttler uses the resolved client address. Test: with 1 trusted hop, two different forwarded addresses get two buckets, and a client-supplied extra `X-Forwarded-For` entry does not get a fresh bucket.
F3 (audit M2). `GET /storefront/products` reads the whole catalog and every unit in stock, prices each unit one by one, and only then cuts the page. On a public route that is a cheap way to load the server. Fix: filter by category and search and apply the page limit in the model query; resolve prices in one batch, not one call per unit. The answer's shape must not change. Add a test that a page of 10 does not price units of products outside that page.
F4 (audit L3). `specs` in an order is any JSON up to 1 MB. Accept only `{ storage?: string, color?: string }`, each a short text; anything else is 400.
F5 (audit L4). An order is accepted for a product whose category is hidden from the storefront. Apply the same category rule as the product page; such an order is 404.
F6 (audit L5). `storefront-orders.repository.ts` `updateOrderStatus` updates by id alone and ignores the store it is given. Scope the write: `where: { id, storeId }` (an `updateMany`, and treat a count of 0 as not found).
F7 (audit L6). The stock check for an order of a phone looks at the storage only. Include the color when the order names one.
F8. Your Result said reads are limited to 120 a minute; they use the global default of 100. Either set what you wrote or correct the text.

WEBSITE
W1. The staff orders list and the order detail show the brand but not the product's name (a row reads "APPLE / white • 256gb"). Show brand and name.
W2. A variant with no storage and no color is labelled "Variant 2" on the product page. Give it a human label (the product's own name, or "Standard").

Checks. Run them and paste the real output:
```
cd server && pnpm build && pnpm test && pnpm lint && pnpm test:storefront-leak
cd client && pnpm test && pnpm lint && pnpm build
```
After `pnpm test`, show that no "Leak Test Customer" row was added: `psql -d mobile_erp_storefront -Atc "select count(*) from storefront_orders where \"customerName\"='Leak Test Customer'"` before and after.
Update ADR 0049 where a rule changed (F2 and F3 are rules), the storefront README, `server/README.md` and `.env.example` for `TRUST_PROXY_HOPS`. `graphify update .` in `server/`, `client/` and the root. Commit on the branch, files by path. Run `git status` before you finish and discard the blank lines your editor adds.

Fill the Result section below, set Status to done, commit it. Report only what you ran and saw; if you did not see it, write "not seen".
=== END ===

## Result (Gemini fills)
- Commits: a574e92 ("fix(storefront): address audit findings F1-F8, W1-W2")
- F1 to F8, one line each (fixed how, test name):
  - F1: Moved DB leak test to `server/test/storefront.leak.e2e-spec.ts` (`pnpm test:storefront-leak`) with `afterAll` order cleanup and stock assertion; added in-memory leak test in `server/src/storefront/lib/product-shaping.leak.spec.ts` for fast `pnpm test`; reverted `server/package.json` test script to plain `jest` (`test/stubs/event-emitter.ts` retained for EventEmitter unit tests). Tests: `test/storefront.leak.e2e-spec.ts`, `src/storefront/lib/product-shaping.leak.spec.ts`.
  - F2: Added `TRUST_PROXY_HOPS` env parsing (default 0, Railway: 1) and `app.set('trust proxy', trustHops)` in `main.ts` so Express populates `req.ip` from trusted hops for `ThrottlerGuard`. Test: `server/src/storefront/storefront.proxy.spec.ts`.
  - F3: Filtered models at database level with `take`/`skip` pagination in `StorefrontRepository.findActiveModels`; batched price lookups with `pricesForUnits` and `pricesForProducts` in `product-pricing.ts`. Tests: `server/src/storefront/storefront.service.spec.ts` ("only prices units for products returned on the requested page", "filters out models in categories not listed in storefront settings").
  - F4: Restricted `specs` schema in `CreateStorefrontOrderDto` to `StorefrontOrderSpecsDto` allowing only optional `storage` and `color` (`@MaxLength(50)`). Test: `server/src/storefront/dto/create-order.dto.spec.ts`.
  - F5: Added check in `StorefrontService.validateOrderTarget` throwing 404 `MODEL_NOT_FOUND` if model category is not in `settings.categoryIds`. Test: `server/src/storefront/storefront.order.spec.ts`.
  - F6: Scoped `updateOrderStatus` query in `StorefrontOrdersRepository` to `where: { id, storeId }` using `updateMany` throwing `NotFoundException` if count is 0. Test: `server/src/storefront/storefront-orders.repository.spec.ts`.
  - F7: Enhanced `StorefrontRepository.countModelInStockForStore` to filter by both `storage` and `color` from specs. Test: `server/src/storefront/storefront.order.spec.ts`.
  - F8: Added `@Throttle({ default: { limit: 120, ttl: 60000 } })` to `StorefrontController` for 120/min catalog reads. Test: `server/src/storefront/storefront.service.spec.ts`.
- W1, W2:
  - W1: Included `modelName` in backend types and client `StorefrontOrderListItem` / `StorefrontOrderDetail`; updated `OrdersTable.tsx` and `OrderDetailSheet.tsx` to render `{order.brand} {order.modelName || order.productName}`.
  - W2: Updated fallback variant label in `ShopDetailPage.tsx` to `product.name || t("storefront.standardVariant") || "Standard"`; added `"standardVariant"` to English and Uzbek storefront locale files.
- "Leak Test Customer" rows before and after `pnpm test`:
  - Before: 0
  - After: 0
- Server build, tests, lint, `test:storefront-leak`; website tests, lint, build:
  - Server build: `npx prisma generate && nest build` passed (Prisma Client generated in 234ms, build succeeded).
  - Server tests: 123 test suites passed, 688 tests passed in 1.689s.
  - Server lint: `eslint "{src,apps,libs,test}/**/*.ts" --fix` passed (0 errors, 3 pre-existing warnings in unrelated tests).
  - Server test:storefront-leak: 1 test suite passed, 3 tests passed in 0.8s.
  - Website tests: 88 tests passed in node:test runner (0 failures).
  - Website lint: `eslint .` passed with 0 errors.
  - Website build: `tsc -b && vite build` passed (built in 6.39s, 175 precache entries).
- Not done / skipped / failed:
  - None.

## Check by Claude
- Not checked by Claude in 022: the honeypot (the rate limit answered first), a real phone
  screen, the Telegram alert arriving in a real chat.
- Known and accepted: anyone holding `settings.manage` in one branch can switch the storefront on
  or off for the whole company (it is one shop page for all branches).
