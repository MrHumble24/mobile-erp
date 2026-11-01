# 003 — Build the web UI for the shipped server features (waves 1, 2a–2d)

Status: open · Owner: Gemini (Antigravity) · Depends on: 001 (done), server `main` ≥ `f6921e8`

## Why
The server now exposes auth, RBAC, inventory, QC, POS sales, consignment, expenses, settings and
reports (merged 2026-11-01). The client is still the shadcn kit in `client/src/shared/ui` plus a
placeholder `App.tsx`. This handoff asks Gemini to build the FSD client for everything the server
already does, in the order a cashier and the owner actually use it. Uzbek copy is Gemini's.

Server contract lives in the module READMEs under `server/src/<module>/README.md`; the summary below
is enough to build against. Run the server with `pnpm start:dev` in `server/`; dev logins are in
`server/.env` (`BOOTSTRAP_ADMIN_*`, `SEED_CASHIER_*`, `SEED_QC_*`). Never commit `.env`.

=== MESSAGE ===
Read `.agent/rules/client-fsd.md`, `.agent/rules/client-stack.md`, `.agent/rules/file-size.md` first. Then build the web client in `client/` for the server features listed below. Work on branch `gemini/ui-waves-1-2`, commit per step with only the paths you changed, `pnpm lint` and `pnpm build` green at every commit. No file over 300 lines. Native `<button>/<input>/<table>/<a>` only inside `src/shared/ui/**`. All UI text in Uzbek (Latin) through `src/shared/i18n` (see handoff 002); keys, not literals, in components.

**Server facts you build against**
- Base URL `http://localhost:3000`. Auth header `Authorization: Bearer <accessToken>`. Every error body is `{ statusCode, message, error }`. Money fields arrive as decimal strings.
- `POST /auth/login { email, password }` → `{ accessToken, user: { id, email, profile, roles: string[], permissions: string[] } }`. Token lasts 12h, no refresh: on 401 anywhere, clear the session and go to `/login`. `GET /auth/me` returns the same `user` shape.
- Authorization is by permission code, never by role name. Hide a route/button when `user.permissions` lacks its code. The server strips `acquisitionCost`, `landedCost`, `landedCostSnapshot`, `overheadCost`, `repairCostEstimate` without `device.cost.view` and `netProfit` without `sale.profit.view`; render those columns only when the code is present.
- Optimistic lock: `DeviceView.version` must be echoed as `expectedVersion` on `POST /devices/:id/status`, `POST /sales`, `POST /sales/:id/return`, `POST /consignments`, `/settle`, `/return`. A 409 means stale data: refetch and show "qayta urinib ko'ring".
- Offline-safe writes: generate a `clientMutationId` (uuid) once per checkout / consignment attempt and resend the same id on retry; the server returns the existing record instead of duplicating.
- IMEI is exactly 15 digits; barcode scanners type it as keyboard input followed by Enter (use `BarcodeInput`).

**Routes and endpoints (permission in brackets)**
- Auth: as above.
- Devices `[device.read]`: `GET /devices?imei&modelId&storage&statusCode&search&page&pageSize` → `{items,total,page,pageSize}`; `GET /devices/by-imei/:imei` → device + `model{brand,name}` + `status{code,label}` + `latestInspection|null`; `GET /devices/:id`, `GET /devices/:id/history`; `PATCH /devices/:id {specs?, targetPrice?}` `[device.update]`; `POST /devices/:id/status {toStatusCode, reason?, expectedVersion}` `[device.status.change]`. Statuses: IN_STOCK, DEFECTIVE, CONSIGNED, SOLD.
- Device models `[device.read / device.update]`: `GET|POST /device-models`, `PATCH /device-models/:id` `{brand,name,isActive}`.
- Suppliers `[shipment.read / shipment.manage]`: `GET|POST /suppliers`, `PATCH /suppliers/:id` `{name,country?,contact?,notes?,isActive?}`.
- Shipments `[shipment.read / shipment.manage]`: `GET|POST /shipments` `{supplierId, shipmentDate, expectedCount, overheadCost?, notes?}`, `PATCH /shipments/:id`; intake `POST /shipments/:id/devices {devices:[{imei, modelId, specs:{storage,color,...}, acquisitionCost, targetPrice?}]}` `[device.create]`, duplicate IMEI → 409.
- QC `[qc.read / qc.create]`: `GET /qc/defect-types`, `GET /qc/grades`, `GET /qc/inspections?deviceId=`, `POST /qc/inspections {deviceId, passed, gradeCode?, batteryHealth?, repairCostEstimate?, notes?, defects:[{defectCode, notes?}]}`.
- Stock alerts `[device.read / settings.manage]`: `GET /stock-alert-rules`, `GET /stock-alert-rules/low-stock` (adds `currentCount`), `POST|PATCH` `{modelId, storage, threshold}`.
- Customers `[customer.read / customer.manage]`: `GET /customers?q=`, `GET /customers/:id`, `GET /customers/:id/sales`, `POST|PATCH` `{name, phone?, notes?}`.
- Sales: `POST /sales {imei, salePrice, customerId? | customer?{name,phone}, warrantyDays?, notes?, clientMutationId, expectedVersion?}` `[sale.create]` → `SaleView {id, device{imei,model,specs}, customer, salePrice, landedCostSnapshot, netProfit, soldAt, soldBy{id,name}, warranty{days,startsAt,endsAt}|null, consignmentId}`; 404 unknown IMEI, 409 not IN_STOCK. `GET /sales?from&to&soldById&customerId&channel=retail|b2b&page&pageSize`, `GET /sales/:id` `[sale.read]`. `GET /sales/warranty/:imei` `[sale.read]` → `{imei, saleId, purchasedAt, salePrice, warranty, remainingDays, latestInspection{grade,notes}|null, alreadyReturned}`. `POST /sales/:id/return {refundAmount, reason?, deviceToStatusCode:'IN_STOCK'|'DEFECTIVE', expectedVersion?}` `[sale.return]`. `GET /sales/:id/receipt` `[sale.read]` → `{saleId, soldAt, cashier, items:[{imei, model, storage, color, price}], total, warranty{days,endsAt}|null, customer?}` for the thermal printer (print via a print-only CSS view, 58 mm width).
- Partners `[partner.read / partner.manage / partner.payment]`: `GET /partners` → `PartnerView {…, creditLimit, outstanding, openCount, overdueCount}`, `GET /partners/:id`, `GET /partners/:id/ledger` → `[{at, kind:'consignment'|'payment', refId, change, runningBalance, statusCode, notes}]`, `POST|PATCH /partners`, `POST /partners/:id/payments {amount, consignmentId?, paidAt?, notes?}`.
- Consignments: `POST /consignments {imei, partnerId, agreedPrice, dueDate, notes?, clientMutationId, expectedVersion?}` `[consignment.create]` (409 body for credit limit: `{message, creditLimit, outstanding, agreedPrice, projected}`); `GET /consignments?partnerId&statusCode&overdue&page&pageSize`, `GET /consignments/overdue`, `GET /consignments/:id` `[consignment.read]`; `POST /consignments/:id/settle {salePrice?, notes?, expectedVersion?}`, `POST /consignments/:id/return {reason?, expectedVersion?}` `[consignment.settle]`. Statuses: OUT, SETTLED, RETURNED.
- Expenses `[expense.read / expense.manage / expense.category.manage]`: `GET|POST|PATCH /expense-categories`; `GET /expenses?from&to&categoryId&isRecurring&page&pageSize`, `GET /expenses/summary?from&to` → `{total, byCategory:[{categoryId,name,total}]}`, `POST|PATCH|DELETE /expenses` `{categoryId, amount, description?, isRecurring?, incurredAt?}`.
- Settings: `GET /settings` (any user) → `{telegramChatId, closingTime, defaultWarrantyDays, minMarginPercent, lowStockThreshold}`; `PUT /settings` `[settings.manage]`.
- Reports `[report.finance]`: `GET /reports/profit?from&to` → `{revenue, cogs, grossProfit, expenses, netOperatingIncome, unitsSold, byChannel:{retail,b2b}, returnsRefunded}`; `GET /reports/expenses?from&to&groupBy=category|month` → `[{key,label,total}]`; `GET /reports/model-pricing?modelId?&windowDays=90` → `[{modelId, storage, avgAcquisitionCost, avgLandedCost, avgSellingPrice, unitsInStock, unitsSold}]`; `GET /reports/daily-closing?date=YYYY-MM-DD`.
- Admin `[user.manage / role.manage]`: `GET|POST /users`, `PATCH /users/:id {profile?, isActive?}`, `PUT /users/:id/roles {roleCodes[]}`, `PUT /users/:id/permissions {overrides:[{permissionCode, granted, reason?}]}`; `GET /access/roles`, `GET /access/permissions`, `POST /access/roles`, `PUT /access/roles/:code/permissions {permissionCodes[]}`, `DELETE /access/roles/:code`. A user may only grant what they themselves hold (403 otherwise).

**Build order (one commit each)**
1. `app/`: `providers/query-provider.tsx` (one QueryClient, devtools in dev), `router/routes.tsx` with lazy pages, `router/require-permission.tsx` layout route reading the auth store, `styles/`. `shared/api/http.ts` — the only `fetch`: base URL from `VITE_API_URL`, attaches the token, normalizes `{statusCode,message}` errors, logs out on 401. `features/auth`: `model/auth.store.ts` (Zustand, persisted token + user), `api/auth.repository.ts`, `model/use-login.ts`, `ui/LoginForm.tsx`; `pages/login`. App shell widget: sidebar built from the permission codes, user menu, logout.
2. `entities/device` (types, `device.repository.ts`, `device.keys.ts`, `use-devices.ts`, `use-device-by-imei.ts`, `DeviceStatusBadge`, `DeviceTable`), `entities/device-model`, `pages/inventory` with filters (search, model, storage, status) and the IMEI quick-lookup drawer showing specs, status, history, latest QC.
3. `features/intake-shipment` (supplier + shipment form, then scan-loop device registration: scan IMEI → pick model → storage/color → cost → next; duplicate IMEI shown inline), `entities/shipment`, `entities/supplier`, `pages/shipments`.
4. `features/grade-device` (QC form: pass/fail, grade, battery, defects checklist from `/qc/defect-types`, repair estimate), `pages/qc` listing IN_STOCK and DEFECTIVE devices awaiting inspection.
5. `widgets/pos-terminal` + `features/checkout`: scan IMEI → device card → price (prefilled with `targetPrice`) → optional customer (search by phone or inline create) → warranty days (default from `/settings`) → confirm → receipt view with print button. Cart draft in `features/checkout/model/cart.store.ts`. `pages/pos`.
6. `features/warranty-lookup` (scan IMEI → `/sales/warranty/:imei` → remaining days, sale, QC notes → "Qaytarish" return dialog with refund amount and IN_STOCK/DEFECTIVE choice), `entities/sale`, `entities/customer`, `pages/sales` (list with channel filter), `pages/customers`.
7. `entities/partner`, `entities/consignment`, `features/consign-device` (one-tap transfer: partner select → scan → agreed price → due date; show credit-limit 409 details), `features/settle-consignment` (settle / return), `features/record-partner-payment`, `pages/partners` (balances, ledger), `pages/consignments` (OUT / overdue tabs).
8. `entities/expense`, `entities/expense-category`, `features/log-expense`, `pages/expenses` with summary by category.
9. `pages/dashboard` (admin): profit report for today / this week / this month, expenses, low-stock list, model pricing table, overdue consignments; use `MetricCard`. `pages/settings` (`PUT /settings`), `pages/users` (users, roles, permission matrix editor), `pages/reports`.
10. Fill the Result section of `docs/handoffs/gemini/003-ui-for-wave-1-2-features.md` (commits, slices added, i18n keys added, anything the server is missing for the UI) and set Status to done. Do not change `server/**`; list server gaps in the Result instead.

Hard rules recap: React Query for all server state (`use-*.ts` hooks only, keys from `*.keys.ts`), Zustand only for session, drafts and UI mode, repositories are the only HTTP callers, pages read the URL and pass props down, one component per file, slice `index.ts` is the only import path across slices.
=== END ===

## Result (Gemini fills)
- Commits:
- Slices added:
- i18n keys added:
- Server gaps found (for the backend agent):
- Notes for other agents:
