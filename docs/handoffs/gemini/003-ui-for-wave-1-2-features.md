# 003 — Build the web UI for the shipped server features (waves 1, 2a–2d)

Status: done · Owner: Gemini (Antigravity) · Depends on: 001 (done), server `main` ≥ `f6921e8`

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
- **Commits**:
  - `556026d` feat(client): step 1 - app shell, router, http client, auth feature, i18n
  - `e671196` feat(client): step 2 - device and device-model entities, inventory page with filters and quick-lookup drawer
  - `8ced79a` feat(client): step 3 - supplier and shipment entities, intake-shipment feature, shipments page
  - `a14eb98` feat(client): step 4 - qc entity, grade-device feature, qc inspection page
  - `423eb92` feat(client): step 5 - pos terminal widget, checkout feature, cart store, customer and sale entities
  - `5c2a245` fix(client): align app shell bars, token-colored sidebar, collapse toggle
  - `616dff8` feat(client): step 6 - warranty-lookup feature, sales and customers pages
  - `0f272b8` feat(client): step 7 - partner and consignment entities, consign/settle features, partners and consignments pages
  - `0c2d62f` feat(client): step 8 - expense and expense-category entities, log-expense feature, expenses page
  - `9faaf72` feat(client): step 9 - dashboard, settings, users and reports pages

- **Slices added**:
  - `app`: `QueryProvider` (React Query client configured with `staleTime: 30s`, `retry: 1`), `routes.tsx` (React Router routes with lazy page imports and permission guards), `RequirePermission` (permission-gated route outlet), `styles` (theme tokens, Inter / JetBrains Mono typography).
  - `shared`:
    - `api/http.ts`: centralized fetch client supporting `VITE_API_URL`, automatic `Authorization: Bearer <token>` injection, 401 unauthenticated session clearance, and normalized error throwing `{ statusCode, message, error }`.
    - `i18n`: reactive context provider with Uzbek (Latin, default) and English locales across all feature namespaces.
    - `ui`: full kit of accessible primitives built on `@radix-ui` (Button, Input, Select, Dialog, Sheet, Table, Tabs, Badge, Checkbox, Switch, Card, Sonner, MetricCard, BarcodeInput, etc.).
  - `entities`:
    - `device`: types, `deviceRepository`, `deviceKeys`, `useDevices`, `useDeviceByImei`, `useDevice`, `useDeviceHistory`, `useChangeDeviceStatus`, `DeviceStatusBadge`, `DeviceTable`, `DeviceHistoryTimeline`, `DeviceQuickView`.
    - `device-model`: types, `deviceModelRepository`, `deviceModelKeys`, `useDeviceModels`, `useCreateDeviceModel`, `useUpdateDeviceModel`.
    - `supplier`: types, `supplierRepository`, `supplierKeys`, `useSuppliers`, `useCreateSupplier`, `useUpdateSupplier`.
    - `shipment`: types, `shipmentRepository`, `shipmentKeys`, `useShipments`, `useShipment`, `useCreateShipment`, `useIntakeShipmentDevices`.
    - `qc`: types, `qcRepository`, `qcKeys`, `useDefectTypes`, `useQcGrades`, `useQcInspections`, `useCreateQcInspection`.
    - `customer`: types, `customerRepository`, `customerKeys`, `useCustomers`, `useCustomer`, `useCustomerSales`, `useCreateCustomer`, `useUpdateCustomer`.
    - `sale`: types, `saleRepository`, `saleKeys`, `useSales`, `useSale`, `useWarrantyLookup`, `useSaleReceipt`, `useCreateSale`, `useReturnSale`.
    - `partner`: types, `partnerRepository`, `partnerKeys`, `usePartners`, `usePartner`, `usePartnerLedger`, `useCreatePartner`, `useUpdatePartner`, `useRecordPayment`.
    - `consignment`: types, `consignmentRepository`, `consignmentKeys`, `useConsignments`, `useOverdueConsignments`, `useConsignment`, `useCreateConsignment`, `useSettleConsignment`, `useReturnConsignment`.
    - `expense-category`: types, `expenseCategoryRepository`, `expenseCategoryKeys`, `useExpenseCategories`, `useCreateExpenseCategory`, `useUpdateExpenseCategory`.
    - `expense`: types, `expenseRepository`, `expenseKeys`, `useExpenses`, `useExpenseSummary`, `useExpense`, `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`.
    - `stock-alert`: types, `stockAlertRepository`, `stockAlertKeys`, `useStockAlertRules`, `useLowStockAlerts`, `useCreateStockAlertRule`, `useUpdateStockAlertRule`.
    - `report`: types, `reportRepository`, `reportKeys`, `useProfitReport`, `useExpenseReport`, `useModelPricingReport`, `useDailyClosingReport`.
    - `user`: types, `userRepository`, `userKeys`, `useUsers`, `useUser`, `useCreateUser`, `useUpdateUser`, `useSetUserRoles`, `useSetUserPermissions`, `useRoles`, `usePermissions`, `useCreateRole`, `useSetRolePermissions`, `useDeleteRole`.
  - `features`:
    - `auth`: `authStore` (persisted access token & user profile/permissions), `authRepository`, `useLogin`, `LoginForm`.
    - `intake-shipment`: `IntakeShipmentDialog`, `DeviceIntakeLoop` (continuous scan-to-register loop with inline duplicate IMEI conflict handling).
    - `grade-device`: `GradeDeviceDialog` (inspection form with dynamic defect checklist, battery health, grade selection, repair estimate).
    - `checkout`: `cartStore` (Zustand cart draft), `useCheckout` (with idempotent `clientMutationId`), `CheckoutParamsForm`.
    - `warranty-lookup`: `WarrantyLookupPanel`, `ReturnSaleDialog` (lookup by IMEI barcode, remaining warranty display, return & refund dialog with IN_STOCK/DEFECTIVE status option).
    - `consign-device`: `ConsignDeviceDialog` (partner consignment transfer with credit limit 409 handling and clientMutationId).
    - `settle-consignment`: `SettleConsignmentDialog`, `ReturnConsignmentDialog`.
    - `record-partner-payment`: `RecordPaymentDialog`.
    - `log-expense`: `LogExpenseDialog`.
  - `widgets`:
    - `app-shell`: responsive sidebar driven by user permissions, top header bar, user menu, session logout.
    - `pos-terminal`: cash register terminal layout with barcode input, cart items list, price adjustments, customer assignment, receipt dialog with thermal printer preview.
  - `pages`:
    - `login`: `LoginPage`
    - `dashboard`: `DashboardPage` (today/week/month profit KPI metric cards, low-stock alerts table, overdue consignments table, model pricing breakdown)
    - `inventory`: `InventoryPage` (filters by model, storage, status, search, and slide-over IMEI quick-view drawer)
    - `shipments`: `ShipmentsPage` (shipment intake status and intake loop drawer)
    - `qc`: `QcPage` (devices awaiting inspection filtered by IN_STOCK / DEFECTIVE status)
    - `pos`: `PosPage` (POS terminal)
    - `sales`: `SalesPage` (sales table with channel filter, thermal receipt viewer, warranty lookup drawer)
    - `customers`: `CustomersPage` (customer list, create dialog, customer purchase drawer)
    - `partners`: `PartnersPage` (partner list, credit limit tracking, ledger drawer, payment dialog)
    - `consignments`: `ConsignmentsPage` (consignments table with OUT / Overdue / All tabs, settle and return dialogs)
    - `expenses`: `ExpensesPage` (expense list, category summary breakdown card, log expense dialog)
    - `reports`: `ReportsPage` (tabs for Net Profit, Expenses by category/month, Model Pricing 90-day window, Daily Closing)
    - `users`: `UsersPage` (tabs for Users with role assignment, Roles creation, and Permission Matrix editor)
    - `settings`: `SettingsPage` (store configuration: Telegram notifications chat ID, closing time, default warranty days, min margin %, low stock threshold)

- **i18n keys added**:
  Complete parity between `client/src/shared/i18n/locales/uz` and `client/src/shared/i18n/locales/en` across 14 namespaces:
  - `common.json`: core CRUD actions, pagination, table columns, date/number formatting, status badges.
  - `auth.json`: login credentials, token expiry alerts, logout confirmations.
  - `inventory.json`: device attributes, IMEI, brand, model, storage, color, status labels, pricing.
  - `shipments.json`: supplier selection, shipment dates, intake counts, overhead cost allocations.
  - `qc.json`: quality inspection form, grade ratings, battery health %, defect taxonomy, repair cost estimate.
  - `pos.json`: cashier interface, barcode scanner prompt, cart totals, customer quick-select, thermal print.
  - `sales.json`: transaction history, retail/B2B channel badges, return & refund modal, warranty lookup.
  - `customers.json`: contact management, phone numbers, purchase history.
  - `partners.json`: partner profiles, credit limits, outstanding balances, ledger history, payment entry.
  - `consignments.json`: consignment agreements, overdue warnings, settlement and return options.
  - `expenses.json`: expense categories, amounts, recurring flags, date ranges, breakdown metrics.
  - `settings.json`: store parameters, telegram bot chat ID, daily closing time, warranty & margin defaults.
  - `users.json`: user accounts, roles list, system vs custom roles, permission matrix toggles.
  - `reports.json`: revenue, COGS, gross profit, net operating income, daily closing audit metrics.
  - `dashboard.json`: summary KPI titles, low stock alerts, overdue items, model pricing metrics.

- **Server gaps found (for the backend agent)**:
  1. **CORS Headers**: During development with Vite running at `http://localhost:5173` making requests to NestJS server at `http://localhost:3000`, the server must enable CORS (`app.enableCors()`) to allow the Authorization header and standard REST methods (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`).
  2. **`store_settings.minMarginPercent` Type Handling**: `GET /settings` returns `minMarginPercent` as a string from postgres (e.g. `"15.00"`). When submitting `PUT /settings`, the DTO parser expects a valid numeric format. The client explicitly converts with `Number(minMarginPercent)`, but backend DTO validation should ensure `Type(() => Number)` is present on the update DTO.
  3. **Receipt Hardware Direct Printing**: Client provides 58mm CSS `@media print` thermal formatting for standard browser printing. For direct raw thermal printing (ESC/POS over serial/USB/network without OS print dialog), a dedicated backend endpoint or bridge agent service would be beneficial in future waves.

- **Notes for other agents**:
  - The client is fully typed and adheres strictly to Feature-Sliced Design (FSD).
  - All files adhere to the strict 300-line limit and 50-line max function length rule.
  - Both `pnpm lint` (oxlint) and `pnpm build` (tsc + vite) pass with 0 errors and 0 warnings.

