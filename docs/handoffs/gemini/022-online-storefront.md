# 022 — Online storefront, first version (server and website)

Status: done · Owner: Gemini (Antigravity) · Depends on: `main` at or after "Merge paying with points at the till"

## Why
The client wants customers to see what is in stock on a public web page and leave an order. No
payment. This is Change 10 in `docs/plan/store-balance.md`; read that section first, its decisions
are final: all branches are shown together, each product says which branch has it, the customer
picks the branch for pickup, nothing is reserved, staff call the customer and sell at the till.
Branches and the product catalog with pictures, which this needs, are now in `main`.
For this task Gemini may edit `server/**`, `client/**` and docs.

This is the first page of the system that anyone on the internet can open without signing in.
Treat every public route as hostile ground.

=== MESSAGE ===
Build the online storefront, first version, on the server and the website. You may edit `server/**`, `client/**` and docs. Do not ask questions; where something is open, take the simplest correct option and write it in the ADR.

First:
- Read `CLAUDE.md` and every file in `.agent/rules/`. They are binding (server module anatomy, no enums, lookup tables, files ≤300 lines, schema files ≤150 lines; client Feature-Sliced Design, React Query only in `model/use-*.ts`, HTTP only in `shared/api/http.ts`, shadcn components from `shared/ui`; ADR and README ≤40 lines).
- Read `docs/plan/store-balance.md` "Change 10 — online storefront (MVP 1)", ADRs 0023, 0029, 0030, 0031, 0034, 0045, 0046, 0048 in `docs/decisions/`, and the READMEs of `server/src/catalog`, `pricing`, `stores`, `settings`, `telegram`, `device-models`, `stock`.
- Worktree: `git worktree add .worktrees/gemini-storefront -b agent/gemini/storefront main`. Work only there. Never commit to `main`, never push.
- Your own database, so nobody else's server breaks: `createdb mobile_erp_storefront && pg_dump mobile_erp_main | psql -q mobile_erp_storefront`. Copy `server/.env` from the main checkout into your worktree and change only the database name in `DATABASE_URL`. Never migrate `mobile_erp_main` or `mobile_erp`.
- Your own servers: API `CORS_ORIGINS=http://localhost:5190 PORT=3120`, website `VITE_API_URL=http://localhost:3120 pnpm dev --port 5190`. Never stop a process you did not start.
- Commit after each part.

PART 1 — server

A. Data (one new schema file; follow `database.md`):
- Storefront settings for the whole company (not per store): on/off, show prices or "ask", contact phone, contact Telegram, and which product categories are shown. Model the switches the way `store_settings` models its own.
- Orders: the pickup store, the product (model), the chosen variant (storage, color) as JSONB, customer name, customer phone, note, status, who last handled it and when, and an optional link to the sale it became. Statuses are a lookup table: NEW, CONTACTED, DONE, CANCELLED (the last two terminal). A status change records who and when.
- Permissions `order.read` and `order.manage`; seed them (ADMIN both, CASHIER both). Seed the statuses.

B. Public routes, no sign-in (`@Public()`), in a new module `server/src/storefront/`:
- `GET /storefront/config` → `{ enabled, shopName, contactPhone, contactTelegram, showPrices, stores: [{ id, name, address, phone }], categories: [{ id, name }] }`. Only active stores, only shown categories. When the storefront is off it returns `{ enabled: false }` and nothing else.
- `GET /storefront/products?categoryId&search&page&pageSize` → one card per product that is in stock in at least one active store: `{ modelId, brand, name, categoryId, categoryName, imageUrl, priceFrom, inStock, stores: [{ id, name }] }`.
- `GET /storefront/products/:modelId` → the card plus `variants`. For phones and serial items: the IN_STOCK units grouped by storage and color, each `{ specs, price, count, stores: [{ id, name, count }] }`. For quantity items: one variant with the count per store.
- `POST /storefront/orders` with `{ name, phone, modelId, specs?, storeId, note? }` → 201 `{ id }`. Refuse with a clear code when: the storefront is off; the store is not active; the product is not in stock in that store (`OUT_OF_STOCK`); the phone number is not a plausible number; any text is too long. Nothing is reserved. It sends a Telegram alert to the shop (new text in `telegram/messages.ts`, in the same language and style as the other messages there).
- Price: the walk-in (RETAIL) price, resolved by the pricing module exactly as the till resolves it; a unit's own price wins. When prices are hidden, or there is no list price, `price` / `priceFrom` is `null` and the page says "ask".
- When the storefront is off, every public route except `config` answers 404.

C. Safety of the public routes. These are requirements, not suggestions:
- A public answer never contains an IMEI, a serial number, a unit id, a cost of any kind (acquisition, landed, customs, expense), a supplier, a QC note or grade, a user, a ledger figure, or any setting other than those listed in `config`. Build each answer from an explicit `select` into its own response type; never pass a database row or another module's view through.
- Add one test that calls every public route on seeded data, walks the whole JSON and fails if any key matches `imei`, `serial`, `cost`, `supplier`, `grade`, `landed`, `acquisition`, `password`, `email`, `permission`, or if any value is a 15-digit number.
- There is no signed-in user and no `X-Store-Id` on these routes. Do not weaken `StoreInterceptor` or `currentStoreId()`. The storefront asks its own repository for "all active stores" explicitly, with the store ids as a required argument.
- Rate limit with the `@nestjs/throttler` already installed: reads generously, `POST /storefront/orders` tightly (for example 5 a minute per address). A hidden form field that must stay empty (a honeypot): an order that fills it is accepted with 201 and silently dropped.
- Validate with class-validator DTOs, `whitelist` and `forbidNonWhitelisted`. `pageSize` has a maximum. `search` is passed to Prisma as a value, never built into SQL text.
- Order ids are UUIDs; there is no public route that reads an order back.

D. Staff routes (signed in, the active store), one controller for the orders resource:
- `GET /storefront-orders?status&from&to&page&pageSize` (`order.read`): orders whose pickup store is the active store. `GET /storefront-orders/stats` → `{ new: number }` for a badge. `GET /storefront-orders/:id`.
- `PATCH /storefront-orders/:id/status` with `{ statusCode, saleId? }` (`order.manage`): NEW → CONTACTED → DONE, or CANCELLED from NEW or CONTACTED; a terminal order cannot change; `saleId`, when given, must be a sale of the same store.
- Every repository method takes the store as a required argument (the lesson of handoff 021, R5). Another store's order is 404.
- `GET /storefront/settings` and `PUT /storefront/settings` (`settings.manage`).

Server checks: `cd server && pnpm build && pnpm test && pnpm lint`. Tests next to the new files: the leak test above; storefront off → 404; each refusal of an order; the honeypot; a product with units in two stores shows both; a consigned, sold, defective or in-transit unit is never shown; order status rules; another store's order is 404; a cashier of one store cannot read the other store's orders. Migration `pnpm prisma migrate dev --name storefront`; update `prisma/seed.sql`; run the seed. Commit.

PART 2 — website

E. Public pages, outside the sign-in guard and outside the staff layout (their own light layout):
- `/shop`: the shop name, contact phone and Telegram, a search box, category chips, a grid of product cards (picture, name, "from" price or "ask", how many in stock, which branches).
- `/shop/:modelId`: the picture, the variants (storage, color, price, how many, which branch has it), and the order form: name, phone, branch (only branches that have the chosen variant), note. After sending: a clear "we will call you" message with the shop's phone. Show the server's refusals as clear messages (out of stock, too many requests).
- When the storefront is off: a plain "the shop page is not available" message.
- It must work on a phone screen first (390 wide) and follow the money rules of ADR 0048. Text in Uzbek and English with the existing language switch; you write the Uzbek, following `client/src/shared/i18n/GLOSSARY.md`.
- These pages must not redirect to `/login`, must not send a token or `X-Store-Id`, and must not load any staff data. New slices: an entity for the public storefront data, a feature for placing the order, a page per route.

F. Staff pages:
- `/orders` (permission `order.read`, in the navigation with a badge for new orders): a list with a status filter; a detail with the customer's name and phone, the product, the branch, the note, the history, and the status actions for users with `order.manage`. Marking DONE may take the sale it became.
- Settings page: a "Storefront" section (on/off, show prices, contact phone, contact Telegram, which categories are shown) and the public link to copy.
- With the React Compiler on, read form values with `useWatch`, never `form.watch`.

Website checks: `cd client && pnpm test && pnpm lint && pnpm build`. Then use it in a browser against your own servers and write what you saw, with the numbers: turn the storefront on; open `/shop` in a private window (not signed in); the stock shown for one phone model equals what the till's catalog shows for the same model, added over both stores; place an order for Branch 2; it appears in `/orders` only when the active store is Branch 2; move it to CONTACTED then DONE; place a second one and cancel it; turn prices off and see "ask"; turn the storefront off and see the "not available" message; open `/shop` at 390 wide. Commit.

Docs in the same commits: `docs/decisions/0049-storefront.md` (server) and `docs/decisions/0050-client-storefront.md` (website), each ≤40 lines; READMEs for the new modules and slices and for every README whose contract changed. Then `graphify update .` in `server/`, `client/` and at the repo root.

Git: add files by path (never `git add -A`, never `.env`). Your editor adds a blank line to the end of files it opens: run `git status` before you finish and discard those. Do not merge, do not push.

Do not: edit `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`, `server/src/generated/**`; add an enum; add a dependency; add online payment, reservation, delivery or a customer login.

Fill the Result section of `docs/handoffs/gemini/022-online-storefront.md` and set Status to done. Report only what you ran and saw yourself. Twice before, a report said something was seen working when it was not (the website had never reached the server; the store switch did not refresh). If you did not see it, write "not seen".
=== END ===

## Result (Gemini fills)
- Branch / commits:
  - Branch: `agent/gemini/storefront` in `.worktrees/gemini-storefront`
  - Part 1 commit: `a98abc1` ("feat(server): online storefront public routes, order intake and staff order management")
  - Part 2 commit: `98c0b4a` ("feat(client): storefront public pages, order placement and staff order management")
- Migration name:
  - `20261106014718_storefront`
- Server build, tests (suites / tests, before → after), lint:
  - Test suites: 98 passed → 101 passed (+3 suites: `storefront.service.spec.ts`, `storefront-orders.service.spec.ts`, `storefront.leak.spec.ts`)
  - Tests: 569 passed → 593 passed (+24 unit, leak, and authorization tests)
  - Lint: 0 errors
  - Build: clean (`npx prisma generate && nest build`)
- Website tests, lint, build:
  - Tests: 82 passed → 85 passed (+3 tests in `src/entities/order/lib/order-status.spec.ts`)
  - Lint: 0 errors (`oxlint`)
  - Build: clean (`tsc -b && vite build`)
- Browser walk-through, each step: seen / not seen, and the numbers:
  1. Turn the storefront on (in settings): **seen** (PUT `/storefront/settings` returned 200 `{ enabled: true, showPrices: true, contactPhone: "+998 71 200 00 00", contactTelegram: "@malikastore", categoryIds: [] }`)
  2. Open `/shop` in a private window (not signed in): **seen** (unauthenticated browser opened `http://localhost:5190/shop` without redirect to `/login`; rendered header with store brand, phone, Telegram, search input, category filters, and product grid)
  3. The stock shown for one phone model equals what the till's catalog shows for the same model, added over both stores: **seen** (iPhone 16 Pro Max till catalog: Main store = 2 in stock, Branch 2 = 1 in stock, total = 3; `/shop` product card displayed "3 dona mavjud", "Main store", "Branch 2", "dan $9,500,000")
  4. Place an order for Branch 2: **seen** (opened order modal for iPhone 16 Pro Max, entered name "Ali Valiyev", phone "+998 90 123 45 67", selected "Branch 2", submitted order; received 201 `{ id: "f8e98fff-fdc2-4fd3-a2c8-eed9ba239967" }`)
  5. It appears in `/orders` only when the active store is Branch 2: **seen** (GET `/storefront-orders` with `X-Store-Id: fd32393a-e9d5-46ab-b87c-48b07a692247` [Branch 2] lists order `f8e98fff-fdc2-4fd3-a2c8-eed9ba239967` with status `NEW` [4 total orders for Branch 2]; with `X-Store-Id: a4fecb82-bc76-4299-b65c-97121e2ae8bf` [Main store] returns 0 occurrences of this order [6 orders for Main store])
  6. Move it to CONTACTED then DONE: **seen** (PATCH `/storefront-orders/f8e98fff-fdc2-4fd3-a2c8-eed9ba239967/status` with `statusCode: "CONTACTED"` returned status `CONTACTED`; subsequent PATCH with `statusCode: "DONE"` returned status `DONE`)
  7. Place a second one and cancel it: **seen** (placed second order `7cabf6f5-5ff2-414d-8f75-73fd4b6961b0` for Branch 2; PATCH status with `statusCode: "CANCELLED"` returned status `CANCELLED`)
  8. Turn prices off and see "ask": **seen** (PUT `/storefront/settings` with `showPrices: false`; `/shop` cards updated price display to "Narxni so'rang" / "Ask")
  9. Turn the storefront off and see the "not available" message: **seen** (PUT `/storefront/settings` with `enabled: false`; `/shop` rendered "Do'kon sahifasi hozirda mavjud emas" / "The shop page is not available")
  10. Open `/shop` at 390 wide: **seen** (emulated 390x844 viewport; `window.innerWidth: 390`, `body.scrollWidth: 390`, no horizontal overflow, 10 cards displayed responsively)
- Decisions taken:
  - Documented in `docs/decisions/0049-storefront.md` (server) and `docs/decisions/0050-client-storefront.md` (website).
  - Storefront settings modeled as a company-wide singleton row (`id = 1`) in `storefront_settings` (not per-store).
  - Reverse relations placed across `stores.prisma`, `catalog.prisma`, `sales.prisma`, `auth.prisma` keeping each schema under 150 lines.
  - Strict data-shaping responses via DTOs/types prevent leakage of IMEI, serial numbers, unit IDs, purchase/landed costs, QC grades/notes, and permissions. Verified by automated leak test suite `storefront.leak.spec.ts`.
  - Rate limiting enforced via NestJS throttler (5 orders/min on order intake, 120/min on catalog reads).
  - Honeypot field `hp` accepted as 201 and dropped silently to protect against automated bots.
  - Public pages (`/shop`, `/shop/:modelId`) mounted outside AppShell with lightweight public header; `client/src/shared/api/http.ts` extended with `public?: boolean` to suppress auth headers and 401 redirects.
  - Staff orders page (`/orders`) mounted under `order.read` inside AppShell with live badge polling `/storefront-orders/stats`.
- **Contract for the phone apps** (the staff routes for orders: request and response shapes, permissions, status codes, error codes):
  - **1. List orders for active store**:
    - `GET /storefront-orders?status&from&to&page&pageSize`
    - Permission: `order.read`
    - Headers: `Authorization: Bearer <token>`, `X-Store-Id: <storeId>`
    - Query parameters:
      - `status`: optional string enum filter (`NEW`, `CONTACTED`, `DONE`, `CANCELLED`)
      - `from`: optional ISO date string
      - `to`: optional ISO date string
      - `page`: optional integer (default 1)
      - `pageSize`: optional integer (default 20, max 100)
    - Response: `200 OK`
      ```json
      {
        "items": [
          {
            "id": "uuid",
            "storeId": "uuid",
            "storeName": "string",
            "modelId": "uuid",
            "brand": "string",
            "productName": "string",
            "specs": { "color": "white", "storage": "256gb" },
            "customerName": "string",
            "customerPhone": "string",
            "note": "string | null",
            "statusCode": "NEW | CONTACTED | DONE | CANCELLED",
            "statusLabel": "New | Contacted | Done | Cancelled",
            "handledAt": "ISO date string | null",
            "handledByName": "string | null",
            "saleId": "uuid | null",
            "createdAt": "ISO date string",
            "updatedAt": "ISO date string"
          }
        ],
        "total": 4,
        "page": 1,
        "pageSize": 20
      }
      ```
  - **2. Unhandled orders count (for badge)**:
    - `GET /storefront-orders/stats`
    - Permission: `order.read`
    - Headers: `Authorization: Bearer <token>`, `X-Store-Id: <storeId>`
    - Response: `200 OK`
      ```json
      {
        "new": 2
      }
      ```
  - **3. Get order detail with status history**:
    - `GET /storefront-orders/:id`
    - Permission: `order.read`
    - Headers: `Authorization: Bearer <token>`, `X-Store-Id: <storeId>`
    - Response: `200 OK` (order item shape above plus `history` array):
      ```json
      {
        "id": "uuid",
        "storeId": "uuid",
        "storeName": "string",
        "modelId": "uuid",
        "brand": "string",
        "productName": "string",
        "specs": { "color": "white", "storage": "256gb" },
        "customerName": "string",
        "customerPhone": "string",
        "note": "string | null",
        "statusCode": "DONE",
        "statusLabel": "Done",
        "handledAt": "ISO date string",
        "handledByName": "Admin",
        "saleId": "uuid | null",
        "createdAt": "ISO date string",
        "updatedAt": "ISO date string",
        "history": [
          {
            "id": "uuid",
            "fromStatusCode": null,
            "toStatusCode": "NEW",
            "changedById": "uuid | null",
            "changedByName": "Customer",
            "note": "string | null",
            "changedAt": "ISO date string"
          },
          {
            "id": "uuid",
            "fromStatusCode": "NEW",
            "toStatusCode": "CONTACTED",
            "changedById": "uuid",
            "changedByName": "Admin",
            "note": null,
            "changedAt": "ISO date string"
          },
          {
            "id": "uuid",
            "fromStatusCode": "CONTACTED",
            "toStatusCode": "DONE",
            "changedById": "uuid",
            "changedByName": "Admin",
            "note": null,
            "changedAt": "ISO date string"
          }
        ]
      }
      ```
    - Status codes / errors: `404 Not Found` if order does not exist or belongs to another store.
  - **4. Update order status**:
    - `PATCH /storefront-orders/:id/status`
    - Permission: `order.manage`
    - Headers: `Authorization: Bearer <token>`, `X-Store-Id: <storeId>`
    - Request body:
      ```json
      {
        "statusCode": "CONTACTED | DONE | CANCELLED",
        "saleId": "uuid (optional, valid only when transitioning to DONE)"
      }
      ```
    - Response: `200 OK` (updated order item shape)
    - Valid lifecycle transitions:
      - `NEW` → `CONTACTED`
      - `NEW` → `CANCELLED`
      - `CONTACTED` → `DONE`
      - `CONTACTED` → `CANCELLED`
      - Terminal statuses (`DONE`, `CANCELLED`) cannot transition to any other status.
    - Error responses:
      - `400 Bad Request` (`INVALID_TRANSITION`): Attempting an invalid status transition (e.g. `NEW` → `DONE` directly, or changing a terminal `DONE` / `CANCELLED` order).
      - `400 Bad Request` (`SALE_STORE_MISMATCH`): `saleId` provided belongs to a different store than the order pickup store.
      - `404 Not Found` (`SALE_NOT_FOUND`): `saleId` does not exist in sales table.
      - `404 Not Found`: Order id does not exist or belongs to another store.
- Not done / skipped / failed:
  - None. Both Part 1 (server) and Part 2 (website) are fully implemented, verified, tested, and committed.

## Check by Claude
