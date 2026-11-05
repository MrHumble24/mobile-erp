# iOS Screens & Business Flow Architecture

This document maps all screens, sheets, and views in the native iOS app (`mobile/ios/Mobile-erp`) for Malika ERP/POS, structured by operational importance, usage frequency, and business flow.

---

## 1. Executive Summary & Operational Context

The system supports the end-to-end retail and wholesale lifecycle of a mobile electronics store operating in **Malika Bazaar** (Tashkent):
1. **International Batch Intake & Landed Cost** (Korea $\rightarrow$ Tashkent)
2. **Quality Control & Grading** (Cosmetic & functional inspection)
3. **Multi-Channel Distribution**:
   - **B2C Walk-in Retail**: Fast IMEI barcode scanning, customer profile, warranty, receipt.
   - **B2B Bazaar Consignment**: Rapid transfer to partner shops, debt aging, settlement.
4. **Cash Flow & End-of-Day Closing**: Shift registers, expense tracking, daily closing.
5. **Offline-First Synchronization**: Outbox queue for offline sales and consignment actions.

---

## 2. Screen Hierarchy: Grouped by Importance & Frequency

```
┌────────────────────────────────────────────────────────────────────────┐
│ Tier 1: Real-Time / Per-Transaction (Hourly / Constant Walk-in Flow)    │
│  - POS Terminal (PosView, PosCheckoutForm, PosReceiptSheet)            │
│  - Consignment Desk (ConsignmentsView, Consign/Settle/Return Sheets)    │
│  - Floor Inventory Lookup (DevicesTab, DeviceSheet, CameraScanner)     │
│  - Warranty & Claims (WarrantyLookupSheet, ReturnSheet)                │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 2: Shift Operations & Batch Workflows (Daily / Per-Shipment)      │
│  - Morning & Shift Dashboard (DashboardView, KPI tiles, Overdue alerts)│
│  - Batch Procurement & Intake (ShipmentsListView, IntakeSheet)         │
│  - Quality Control Grading (QcScreen, QcQueueView, GradeDeviceSheet)   │
│  - Shift Balancing & Register Close (DailyClosingTab)                  │
│  - Operational Expenses (ExpensesView, LogExpenseSheet)                │
│  - Daily Sales Audit (SalesView, SaleDetailSheet)                      │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Tactical Management & Analytics (Weekly / Periodic)            │
│  - Financial Reporting (ProfitTab, ExpensesReportTab, ModelPricingTab) │
│  - Partner Debt & Aging (PartnersView, PartnerDetailView, Ledgers)     │
│  - Catalog Definitions (DeviceModelsTab, ModelFormSheet)               │
│  - Stock Reorder Thresholds (StockAlertsTab, AlertRuleForm)            │
│  - Customer CRM & Suppliers (CustomersView, SuppliersListView)         │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 4: Governance & System Configuration (Low Frequency / Setup)      │
│  - Staff Access & RBAC (UsersListView, PermissionMatrixView, Roles)    │
│  - Store Policy & Settings (SettingsView, Nasiya, Telegram alerts)     │
│  - Taxonomy Setup (ExpenseCategoriesSheet, QcLookupsView)              │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 5: Operational Reliability & Diagnostics (Technical / Situational)│
│  - Offline Outbox & Sync Conflicts (SyncView)                          │
│  - Developer Console (DevEnvironmentView, DevNetworkView, DevLogsView) │
│  - Session Gateway (RootView, LoginView)                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Tier 1: Real-Time / Per-Transaction (Highest Frequency & High Urgency)
*Core operational tools used continuously on the sales floor during counter sales and partner interactions.*

| Screen / Sheet | File Path | Primary Role | Description & Workflow |
| :--- | :--- | :--- | :--- |
| **POS Terminal** (`PosView`) | `Features/Pos/UI/PosView.swift` | Cashier / Sales | Fast IMEI scan via hardware scanner or camera ([`ScannerField`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Shared/UI/ScannerField.swift)), live device spec/price verification, and checkout trigger. A **Scan / Catalog** mode switch adds a shop-like product grid (ADR 0031 — see below). Supports offline queuing. |
| **POS Checkout Form** (`PosCheckoutForm`) | `Features/Pos/UI/PosCheckoutForm.swift` | Cashier | Sub-view inside POS: Customer selection or creation, sale price entry, payment method, warranty selection, and order finalization. |
| **POS Receipt Sheet** (`PosReceiptSheet`) | `Features/Pos/UI/PosReceiptSheet.swift` | Cashier | Modal sheet presented after completed sale for thermal printing or customer sharing. |
| **Consignments Desk** (`ConsignmentsView`) | `Features/Consignment/UI/ConsignmentsView.swift` | Cashier / Manager | Central active consignment list across Malika Bazaar partner shops with status filters. |
| **Consignments Filter Sheet** (`ConsignmentsFilterSheet`) | `Features/Consignment/UI/ConsignmentsFilterSheet.swift` | Cashier / Manager | Bottom sheet housing outstanding partner debt hero card, overdue count, and status/period filters. |
| **Consign Device Sheet** (`ConsignDeviceSheet`) | `Features/Consignment/UI/ConsignDeviceSheet.swift` | Cashier / Manager | One-tap dispatch form to assign a device to a partner shop with agreed payout price and due date. |
| **Settle Consignment Sheet** (`SettleConsignmentSheet`) | `Features/Consignment/UI/SettleConsignmentSheet.swift` | Cashier / Manager | Settling a sold consigned unit, generating revenue, and adjusting the partner balance. |
| **Return Consignment Sheet** (`ReturnConsignmentSheet`) | `Features/Consignment/UI/ReturnConsignmentSheet.swift` | Cashier / Manager | Taking unsold consigned units back into active store inventory. |
| **Record Payment Sheet** (`RecordPaymentSheet`) | `Features/Consignment/UI/RecordPaymentSheet.swift` | Cashier / Owner | Collecting cash or bank transfer payments against a partner's outstanding debt. |
| **Floor Inventory Lookup** (`DevicesTab`) | `Features/Inventory/UI/DevicesTab.swift` | All Staff | Real-time stock search by IMEI, model, color, and storage. |
| **Device Filter Sheet** (`DeviceFilterSheet`) | `Features/Inventory/UI/DeviceFilterSheet.swift` | All Staff | Bottom sheet housing stock status tiles (In-stock, Consigned, Defective), model selector, and storage picker. |
| **Device Detail Sheet** (`DeviceSheet`) | `Features/Inventory/UI/DeviceSheet.swift` | All Staff | Bottom sheet showing barcode, full technical specifications, QC history, the cost block (customs fee, phone expense + note, landed cost, margin — permission-gated), status change, and — on sold phones too — edit phone expense (`device.expense`) and edit customs fee (`customs.manage`) sheets (`DeviceCostSheets.swift`). |
| **Warranty Lookup** (`WarrantyLookupSheet`) | `Features/Sales/UI/WarrantyLookupSheet.swift` | Cashier / Support | Quick IMEI/phone number lookup to verify active warranty coverage and initiate warranty claims. |

---

### Tier 2: Shift Operations & Batch Workflows (Daily / Per-Shipment)
*Screens used at shift starts/ends, upon receiving overseas shipments, and during daily closing.*

| Screen / Sheet | File Path | Primary Role | Description & Workflow |
| :--- | :--- | :--- | :--- |
| **Dashboard** (`DashboardView`) | `Features/Dashboard/UI/DashboardView.swift` | Owner / Manager | Visual hub showing today's revenue, profit margins, overdue consignment alerts ([`OverdueCard`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Dashboard/UI/DashboardLists.swift)), and low stock warnings ([`LowStockCard`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Dashboard/UI/DashboardLists.swift)). |
| **Shipments List** (`ShipmentsListView`) | `Features/Procurement/UI/ShipmentsListView.swift` | Inventory Lead | Batch procurement registry displaying overseas shipments, landing dates, and supplier details. |
| **Shipment Form** (`ShipmentFormSheet`) | `Features/Procurement/UI/ShipmentFormSheet.swift` | Inventory Lead | Create a shipment batch (supplier, date, expected count, paid-from account). A shipment has no expense of its own (ADR 0026) — no overhead field. Detail shows the computed phone-expense + customs-fee totals and a warning when any phone has no customs fee. |
| **Device Intake Flow** (`IntakeSheet`) | `Features/Procurement/UI/IntakeSheet.swift` | Inventory Specialist | Multi-device intake: scan IMEIs, set acquisition cost, optional per-phone expense + note (`device.expense`), generate barcodes. The customs fee is stamped server-side from the current list and shown in the results. |
| **QC Portal** (`QcScreen`) | `Features/Procurement/UI/QcScreen.swift` | QC Specialist | Inspection portal with persistent IMEI scanner and tabs for queue, history, and defect stats. |
| **Device Grading Sheet** (`GradeDeviceSheet`) | `Features/Procurement/UI/GradeDeviceSheet.swift` | QC Specialist | Device grading form with interactive checklist ([`DefectsChecklist`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Procurement/UI/DefectsChecklist.swift)) to mark units as Passed or Defective. |
| **Daily Register Closing** (`DailyClosingTab`) | `Features/Reports/UI/DailyClosingTab.swift` | Cashier / Owner | Shift-end reconciliation: Tallying cash in drawer, credit card slips, returns deduction, and net cash balance. |
| **Shop Expenses** (`ExpensesView`) | `Features/Expenses/UI/ExpensesView.swift` | Cashier / Owner | Daily operating expense log (rent, lunch, transportation, packaging supplies). |
| **Log Expense Sheet** (`LogExpenseSheet`) | `Features/Expenses/UI/LogExpenseSheet.swift` | Cashier / Owner | Quick form to enter an expense amount, category, date, and receipt notes. |
| **Sales Directory** (`SalesView`) | `Features/Sales/UI/SalesView.swift` | Cashier / Manager | Daily sales audit with date, channel, and payment filters. |
| **Sales Filter Sheet** (`SalesFilterSheet`) | `Features/Sales/UI/SalesFilterSheet.swift` | Cashier / Manager | Bottom sheet housing channel (Retail/B2B), status, and date range filters with zero main-screen clutter. |
| **Sale Detail & Returns** (`SaleDetailSheet`) | `Features/Sales/UI/SaleDetailSheet.swift` | Cashier / Manager | Order breakdown with reprint receipt ([`ReceiptSheet`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Sales/UI/ReceiptSheet.swift)) and device return/refund flow ([`ReturnSheet`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Sales/UI/ReturnSheet.swift)). |
| **Expenses Filter Sheet** (`ExpensesFilterSheet`) | `Features/Expenses/UI/ExpensesFilterSheet.swift` | Cashier / Owner | Bottom sheet housing total overhead spend card, category breakdown, and recurring filter. |

---

### Tier 3: Tactical Management & Analytics (Weekly / Periodic)
*Management and analytical screens used by the store owner to review profitability and maintain commercial terms.*

| Screen / Sheet | File Path | Primary Role | Description & Workflow |
| :--- | :--- | :--- | :--- |
| **Partner Directory** (`PartnersView`) | `Features/Consignment/UI/PartnersView.swift` | Owner / Manager | Overview of all Malika Bazaar partner shops, total outstanding receivables, and credit limits. |
| **Partners Filter Sheet** (`PartnersFilterSheet`) | `Features/Consignment/UI/PartnersFilterSheet.swift` | Owner / Manager | Bottom sheet housing partner debt overview, active/inactive filter, and overdue debt toggle. |
| **Partner Detail & Ledger** (`PartnerDetailView`) | `Features/Consignment/UI/PartnerDetailView.swift` | Owner / Manager | Deep dive into a partner's account: aging debt buckets (0-30, 31-60, 60+ days) and running debit/credit transaction ledger. |
| **Financial Reports** (`ReportsView` → `FinOverviewTab`) | `Features/Reports/UI/ReportsView.swift`, `Features/Reports/UI/OverviewTab.swift` | Store Owner | Revenue, COGS, gross profit and net operating income with a day/week/month trend chart and channel breakdown. A **Customs fees** tab (`CustomsFeesTab`, visible with `customs.read`) picks a customs code and charts its fee over time (reusing `BarChartCard`) with the numbers listed. |
| **Customs Price Lists** (`CustomsView`) | `Features/Customs/UI/CustomsView.swift` | Store Owner | More-tab finance entry (`nav.customs`, `customs.read`). Segmented sections: the current list (fee, previous fee, up/down/same/new marker, used-by-model), every version, and models with no fee. "New price list" sheet (`CustomsNewListSheet`, `customs.manage`) — effective date, note, code/description/fee rows pre-filled from the current list; rejects duplicate codes and an empty list. No file import (ADR 0027). |
| **Expense Analytics** (`ExpensesReportTab`) | `Features/Reports/UI/ExpensesReportTab.swift` | Store Owner | Breakdown of overhead spending by category and recurring vs one-off analysis. |
| **Store Balance** (`BalanceView`) | `Features/Balance/UI/BalanceView.swift` | Store Owner | Cash and card money accounts with their total, and the full ledger history (paged, newest first) filtered by account/type/date. Balances may be below zero (shown in danger). Online-only. Entry: More tab, perm `balance.read`. |
| **Balance Entry Sheet** (`BalanceEntrySheet`) | `Features/Balance/UI/BalanceEntrySheet.swift` | Store Owner | Manual ledger entry — set starting balance, deposit, withdraw, correction (signed amount + reason) — gated on `balance.manage`. |
| **Balance Transfer Sheet** (`BalanceTransferSheet`) | `Features/Balance/UI/BalanceTransferSheet.swift` | Store Owner | Move money between two different accounts (`balance.manage`). |
| **Balance Filter Sheet** (`BalanceFiltersSheet`) | `Features/Balance/UI/BalanceFiltersSheet.swift` | Store Owner | Bottom sheet with account, type and date-range filters for the ledger history. |
| **Model Pricing Benchmarks** (`ModelPricingTab`) | `Features/Reports/UI/ModelPricingTab.swift` | Store Owner | Setting model benchmark prices, target margins, and minimum allowable selling prices. |
| **Customer CRM** (`CustomersView`) | `Features/Customers/UI/CustomersView.swift` | Sales / Owner | Customer directory with purchase history filter and detail sheet ([`CustomerDetailSheet`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Customers/UI/CustomerDetailSheet.swift)). |
| **Customer Filter Sheet** (`CustomerFilterSheet`) | `Features/Customers/UI/CustomerFilterSheet.swift` | Sales / Owner | Bottom sheet housing customer sort order (recent vs alphabetical) and purchase history toggle. |
| **Catalog Models** (`DeviceModelsTab`) | `Features/Inventory/UI/DeviceModelsTab.swift` | Inventory Lead | Managing product (device-model) definitions: **kind** (IMEI / SERIAL / QUANTITY — ADR 0029, locked once the product has units, `catalog.kindLocked`), **category** (picker from `/product-categories`, with a category filter and kind+category shown on each row), **barcode** (unique), maker's **model code**, a `customsCode` (ADR 0027), and dynamic attribute schemas via [`AttributesEditor`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Inventory/UI/AttributesEditor.swift). The form is `ModelFormSheet` and (once the model exists) a **product picture** field (ADR 0031 — see below). |
| **Categories** (`CategoriesSheet`) | `Features/Inventory/UI/CategoriesSheet.swift` | Inventory Lead | Manage product categories (`GET/POST/PATCH /product-categories`) — list, add, edit (name / sortOrder / isActive) in `CategoryEditSheet`. Opened from the `DeviceModelsTab` toolbar (folder, `nav.categories`). Duplicate name → 409 `catalog.errorCategoryExists`. |
| **Stock Alert Rules** (`StockAlertsTab`) | `Features/Inventory/UI/StockAlertsTab.swift` | Inventory Lead | Configuring minimum inventory reorder thresholds per model ([`AlertRuleForm`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Inventory/UI/AlertRuleForm.swift)). |
| **Stock (quantity products)** (`StockView`) | `Features/Stock/UI/StockView.swift` | Inventory / Owner | Quantity-product stock (ADR 0030): on-hand quantity (below-zero flagged), price, cost/value (cost-gated), movements sheet, and write-off / count-correction (`stock.adjust`). Nav entry `nav.stock`, perm `device.read`. |
| **Supplier Directory** (`SuppliersListView`) | `Features/Procurement/UI/SuppliersListView.swift` | Store Owner | Supplier records and fulfillment contact information ([`SupplierFormSheet`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Procurement/UI/SupplierFormSheet.swift)). |

---

### Tier 4: Governance & System Configuration (Low Frequency / Setup)
*System administration screens accessed during initial store configuration, employee onboarding, or policy changes.*

| Screen / Sheet | File Path | Primary Role | Description & Workflow |
| :--- | :--- | :--- | :--- |
| **User Management** (`UsersListView`) | `Features/Users/UI/UsersListView.swift` | Store Owner (Admin) | Employee accounts directory with stats on active/inactive staff. |
| **Users Filter Sheet** (`UsersFilterSheet`) | `Features/Users/UI/UsersFilterSheet.swift` | Store Owner (Admin) | Bottom sheet housing staff counts overview (Total, Active, Inactive), role filter, and status picker. |
| **Create User Sheet** (`CreateUserSheet`) | `Features/Users/UI/CreateUserSheet.swift` | Store Owner (Admin) | Onboarding new staff members with initial roles. |
| **User Profile & Overrides** (`UserDetailSheet`) | `Features/Users/UI/UserDetailSheet.swift` | Store Owner (Admin) | Activating/deactivating users, resetting passwords ([`ResetPasswordSheet`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Users/UI/UserDetailSheet.swift#L137)), and setting explicit per-user permission overrides. |
| **Role Definitions** (`RolesListView`) | `Features/Users/UI/RolesListView.swift` | Store Owner (Admin) | Managing system and custom store roles ([`CreateRoleSheet`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Users/UI/RoleDialogs.swift#L4), [`EditRoleSheet`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Users/UI/RoleDialogs.swift#L49)). |
| **RBAC Permission Matrix** (`PermissionMatrixView`) | `Features/Users/UI/PermissionMatrixView.swift` | Store Owner (Admin) | Fine-grained grid assigning resource permissions (e.g., `device.cost.view`, `sale.create`, `report.finance`) to roles. |
| **Store Settings** (`SettingsView`) | `Features/Settings/UI/SettingsView.swift` | Store Owner (Admin) | Store identity, receipt footers, default warranty duration, minimum margin %, Nasiya/installment policies, and Telegram bot notification credentials. |
| **Expense Categories** (`ExpenseCategoriesSheet`) | `Features/Expenses/UI/ExpenseCategoriesSheet.swift` | Store Owner (Admin) | Adding, editing, and deleting standardized expense categories. |
| **QC Lookup Rules** (`QcLookupsView`) | `Features/Procurement/UI/QcLookupsView.swift` | QC Lead / Owner | Managing defect classifications and cosmetic grade levels ([`LookupFormSheet`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Procurement/UI/LookupFormSheet.swift)). |

---

### Tier 5: Operational Reliability & Diagnostics (Technical / Situational)
*Reliability and connectivity tools running in the background or used during network interruptions and debugging.*

| Screen / Sheet | File Path | Primary Role | Description & Workflow |
| :--- | :--- | :--- | :--- |
| **Sync & Outbox** (`SyncView`) | `Features/Sync/UI/SyncView.swift` | All Staff / Admin | Live network status, manual "Sync now" action, inspecting pending offline writes in the outbox, and resolving server sync conflicts. |
| **Developer Console** (`DevConsoleView`) | `Features/DevConsole/UI/DevConsoleView.swift` | Technicians / Devs | Diagnostics portal protected by passcode ([`DevConsoleGate`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/DevConsole/UI/DevConsoleGate.swift)): |
| **Dev Environment Switcher** (`DevEnvironmentView`) | `Features/DevConsole/UI/DevEnvironmentView.swift` | Technicians / Devs | Switching between Production, Staging, and Development APIs with custom host editing ([`DevEnvEditSheet`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/DevConsole/UI/DevEnvEditSheet.swift)). |
| **Network Traffic Monitor** (`DevNetworkView`) | `Features/DevConsole/UI/DevNetworkView.swift` | Technicians / Devs | Ring buffer of recent HTTP requests/responses with header inspection and cURL export ([`DevNetworkDetailView`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/DevConsole/UI/DevNetworkDetailView.swift)). |
| **App Event Logs** (`DevLogsView`) | `Features/DevConsole/UI/DevLogsView.swift` | Technicians / Devs | Live searchable application logs filtered by severity. |
| **Sign-In Screen** (`LoginView`) | `Features/Auth/UI/LoginView.swift` | All Staff | Authentication gateway with credential fields, offline notice, and developer portal trigger. |
| **App Gateway** (`RootView`) | `App/RootView.swift` | System | Session bootstrap and routing to loading, login, or main shell. |

---

## 3. End-to-End Business Flow Mappings

### Flow A: Retail Counter Sale (B2C)
```
[PosView] Scan IMEI (ScannerField / CameraScanner)
   │
   ▼
[PosView] Auto-fetch device info, model, storage, target price
   │
   ▼
[PosCheckoutForm] Select/Add Customer -> Set Sale Price -> Select Payment -> Set Warranty
   │
   ▼
Submit -> [Outbox: saleCreate (if offline)] -> [PosReceiptSheet] Print / Share Thermal Receipt
```

### Flow B: B2B Bazaar Consignment Transfer & Settlement
```
[ConsignmentsView] Tap "+"
   │
   ▼
[ConsignDeviceSheet] Select Partner -> Scan Device IMEI -> Enter Payout Price & Due Date
   │
   ▼
Device status becomes "Consigned" -> Partner ledger balance increases
   │
   ├── If Sold by Partner: [SettleConsignmentSheet] -> Record sale & settle balance
   ├── If Unsold: [ReturnConsignmentSheet] -> Return device back to In-Stock inventory
   └── If Repaying Debt: [RecordPaymentSheet] -> Deduct payment from partner's balance
```

### Flow C: Incoming Batch Intake & Quality Control
```
[ShipmentsListView] Tap "+"
   │
   ▼
[ShipmentFormSheet] Enter Supplier -> Shipment Date -> Logistics Overhead Costs
   │
   ▼
[IntakeSheet] Scan IMEIs in batch -> Allocate unit acquisition costs -> Print Barcode Labels
   │
   ▼
[QcScreen] / [QcQueueView] Units appear in inspection queue
   │
   ▼
[GradeDeviceSheet] Run DefectsChecklist:
   ├── Passed   -> Status set to "In Stock" (immediately sellable)
   └── Defective -> Status set to "Defective" (isolated until repaired/discounted)
```

### Flow D: Shift Close & Register Reconciliation
```
[DailyClosingTab]
   ├── 1. Review Total Gross Sales (from PosView & SalesView)
   ├── 2. Subtract Recorded Expenses (from ExpensesView)
   ├── 3. Subtract Returns & Refunds (from ReturnSheet)
   ├── 4. Count Physical Cash in Register vs Card/Transfer Receipts
   └── 5. Finalize Shift Close & Submit to Store Owner via Telegram Bot
```

---

## 4. Role-Based Screen Visibility Matrix

| Screen / Feature | Store Owner (Admin) | Store Manager / Cashier | Inventory / QC Specialist |
| :--- | :---: | :---: | :---: |
| **POS Terminal & Checkout** | ✅ Full | ✅ Full | ❌ |
| **Inventory Lookup (Basic)** | ✅ Full | ✅ Full | ✅ Full |
| **Device Cost / Margins** | ✅ Visible | ❌ Redacted | ❌ Redacted |
| **Consignments & Partners** | ✅ Full | ✅ Full | ❌ |
| **Shipments Intake** | ✅ Full | ❌ | ✅ Full |
| **QC Grading** | ✅ Full | ❌ | ✅ Full |
| **Financial Reports (Profit/Loss)**| ✅ Full | ❌ | ❌ |
| **Daily Register Closing** | ✅ Full | ✅ Shift Submit | ❌ |
| **Users & RBAC Matrix** | ✅ Full | ❌ | ❌ |
| **Store Settings** | ✅ Full | ❌ | ❌ |
| **Sync & Outbox** | ✅ Full | ✅ View Queue | ✅ View Queue |

---

## 5. Cash / Card Payments (where money moves)

Every money movement is recorded against a ledger account (`CASH`, `CARD`, …).
Two shared controls in the kit carry this everywhere; account options come from
`GET /ledger/accounts` (any signed-in user — no `balance.read`), falling back to
the two known codes `CASH`/`CARD`.

- **`AccountPicker`** (`Shared/UI/AccountPicker.swift`) — one account, default
  Cash. Used by Log Expense, Recurring Expense, Record Payment, Shipment Form.
- **`PaymentMethodField`** + **`PaymentSelection`** (`Shared/UI/PaymentMethodField.swift`)
  — Cash / Card / Split, with a per-account amount and a live "left to assign"
  for a split. Used by POS checkout.
- Account naming/loading is `PaymentAccounts` (`Shared/UI/PaymentAccount.swift`).

| Screen | Behaviour |
| :--- | :--- |
| **POS Checkout** (`PosCheckoutBar`) | Cash / Card / Split; a split must add up to the cart total before Pay enables. One `POST /sales` per phone, so the cart-level split is allocated across the lines by `allocateSalePayments` (`Features/Pos/Lib/PosPayments.swift`, pure, Decimal) — each sale's `payments` sum to its own price. The chosen split rides in the offline outbox too. |
| **Sale Detail / Receipt** (`SaleDetailSheet`, `ReceiptSheet`) | Shows the tender line(s); nothing when `payments` is empty. |
| **Sale Return** (`ReturnSheet`) | One read-only line naming the account(s) the refund returns to. The refund field is capped at what was paid; over that shows `sales.refundTooHigh` (the server also rejects 400 — ADR 0028). |
| **Expenses** (`LogExpenseSheet`, `ExpenseDetailSheet`, rows) | Account picker (default Cash); detail + rows show the account. |
| **Recurring Expense** (`ExpenseRecurrenceSheet`) | Account picker (default Cash). |
| **Partner Payment** (`RecordPaymentSheet`) | Account picker (default Cash). Payment rows in the partner ledger now show the account (`GET /partners/:id/ledger` carries `accountCode`; null for old rows). |
| **Shipment Form / Detail** (`ShipmentFormSheet`, `ShipmentDetailSheet`) | "Paid from" picker on create (default Cash), read-only afterwards. No overhead field (ADR 0026). |
| **Store Balance** (`BalanceView`) | History renders every type (`SALE`, `REFUND`, `PARTNER_PAYMENT`, `PURCHASE`, `OVERHEAD`, `EXPENSE`, `DEVICE_EXPENSE`, `CUSTOMS`) and offers them in the type filter. A row's `amount` can be `null` (cost hidden from this user) → shows `balance.amountHidden`. The split control's segment reads `balance.paySplit`. |

DEBUG screenshot args added: `-posDemo cash|split|serial` (seeds a demo checkout
line; `serial` seeds a serial unit), `-posScan <code>` (adds a cached unit to the
cart, no checkout), `-posSell <code>` (runs a real end-to-end checkout of a cached
unit through the POS view-model — scan → confirm → `POST /sales`),
`-openExpense new`, `-openShipmentForm new`, `-openPartnerPayment 1`,
`-openShipmentDetail <id>`, `-openIntake <id>`, `-intakeModel <modelId>`
(preselects a model in the intake form so a serial/IMEI field shows without
tapping the picker), `-openModel new|<id>` and `-openCategories 1` (on the
inventory Models tab, reached via `-openTab models`), `-openDeviceEdit
expense|customs` (within a device sheet opened by `-openDevice <code>`),
`-openCustomsTab current|versions|unmatched`, `-openCustomsNew 1`, `-open
customs`, and `-openTab customs` on the reports screen.

## Product kinds & serial units (ADR 0029)

A product (device model) has a **kind**: `IMEI` (phones), `SERIAL` (one row per
unit, identified by a serial number — consoles/laptops/watches), `QUANTITY`
(counted by pieces; catalog-only for now, a later task adds its stock/sales). A
unit carries an `imei` **or** a `serialNumber`, never both — `imei` is now
nullable in every response. One shared helper, `Shared/UnitCode.swift`, is the
single source for the display code (`display(imei:serialNumber:)` → `unitCode`
everywhere) and for classifying a scanned/typed code into `imei` vs
`serialNumber` for a write body (`classify` — non-IMEI → serial). Every unit DTO
and the SwiftData `DeviceEntity` cache carry `serialNumber` + `kindCode`; old
cached rows still load (both optional). Intake branches on the model's kind
(serial field vs IMEI slots; QUANTITY models are hidden). POS, consignment,
warranty, sync and search all accept a serial and send it in the right field; the
offline outbox carries whichever code was scanned. Fields that cover both show
the label `catalog.unitCode` ("IMEI / serial number"). The `catalog` namespace is
registered in `I18n/I18n.swift`. Sales decoders tolerate a `QUANTITY` sale
(`device: null`, model+quantity at the top level) so a mixed list never fails to
decode.

## Quantity-product stock, sales & the till (ADR 0030)

A `QUANTITY` product (cases, cables, chargers) has no units — its stock is a
signed movement log whose sum is the on-hand quantity (may be **below zero**;
flagged, never blocked). No slice README is added (the pbxproj exception set is
not edited); the slice is documented here.

- **Stock** (`StockModule`, `Features/Stock/`) — a new nav entry next to
  Inventory, label `nav.stock`, perm `device.read`. `StockView` lists each
  counted product (quantity, price, and — with `device.cost.view` — average cost
  and stock value) with a category filter and a name/barcode/model-code search; a
  product below zero shows in danger with `catalog.belowZero`, a product at zero
  an out-of-stock badge. A row opens `StockMovementsSheet` (paged movements,
  newest first; `unitCostSnapshot` cost-gated) which, with `stock.adjust`, offers
  `StockAdjustSheet` — **write off** (quantity + required reason) and **count
  correction** (counted quantity; the difference against the current level is
  shown before saving). Online-only.
- **Product form** (`ModelFormSheet`) — for a `QUANTITY` kind the form shows the
  price per piece (`salePrice`) and hides the attribute schema and customs code.
- **Shipment stock lines** (`ShipmentItemsSheet`, from the detail's "Add stock")
  — pick a QUANTITY product, pieces and cost per piece, stage one or more lines
  (each with its line total), save (`POST /shipments/:id/items`); the "paid from"
  account is shown read-only. The detail shows the lines added this session (the
  server has no read of a shipment's quantity lines — a known gap).
- **Till** (`PosView`) — the scan field takes any code: a unit (IMEI/serial)
  resolves from the cache and behaves as before; a product barcode resolves from
  the cache (offline) or `GET /scan/:code` (online) and is added straight to the
  cart (a re-scan raises the quantity). A toolbar "+" opens
  `PosProductSearchSheet` (find by name via `GET /stock?search=`). A quantity cart
  line (`PosCartLineRow`) has a quantity stepper, a price per piece (default
  `salePrice`, editable) and its line total, and warns when the quantity exceeds
  stock without blocking. A cart mixes phones, serial units and quantity lines;
  the cart's Cash/Card/Split choice is allocated across the line totals by
  `allocateSalePayments`, one `POST /sales` (or outbox entry) per line.
- **Offline** — `products[]` from `/sync/changes` is cached in `ProductEntity`
  (added to `LocalSchema`; an existing store migrates by adding the table). A
  quantity line sells offline: the barcode is looked up in the cache and the sale
  is queued in the outbox with `modelId`+`quantity` and no device lock.
- **Receipt / list / detail / return** — a quantity sale/line shows the product
  and `× quantity` (plus price-per-piece and line total on receipts) across the
  POS receipt, the sales list/detail, the server receipt, the CSV export and the
  returns report row. `ReturnSheet` hides the restock-condition for a quantity
  sale (the pieces are restored regardless).

DEBUG args added: `-open stock`; `-openStockMovements first` (open the first
product's movements); `-openStockAdjust writeOff|count` (open an adjust sheet);
`-openShipmentItems 1` (open the add-stock sheet on a shipment detail);
`-posMix "<unitCode>,<barcode>"` (seed a phone + 3 pieces), `-posSplit 1` (split
the cart half CASH / half CARD), `-posSellMix "<unitCode>,<barcode>"` (seed,
split and run a real checkout); `-openSaleReceipt 1` / `-openSaleReturn 1` (open
the receipt / return sheet on a sale detail).

## Till catalog, product pictures & code lookup (ADR 0031)

Change 5 adds a shop-like catalog mode to the till, a picture per product, and
intake that fills the model/colour/storage from a typed or scanned code. The web
is the single source of behaviour; the i18n `catalog` namespace carries the copy.
No new slice README is added (the pbxproj exception set is not edited); the
`Catalog` slice and these additions are documented here.

- **Product picture** (`Shared/UI/ProductImageView.swift`) — one shared view that
  draws a picture from a model's `imageUrl` (a `/uploads/...` path served without
  a token) against the current API base, with an `NSCache` + `URLCache`-backed
  loader (`ProductImageLoader`) so the grid scrolls smoothly and pictures already
  seen show offline. The model form (`ModelPictureField`, shown once the model
  exists) picks from the photo library (`PhotosPicker`) or the camera
  (`CameraPhotoPicker`, real device only), downscales to a JPEG ≤ 2 MB
  (`ProductImageEncode`) and maps the server's 400/413 to `catalog.errorPicture*`.
  Thumbnails show in the models list. The multipart upload lives in `APIClient`
  (`postMultipart`), not the feature.
- **Catalog mode** (`Features/Catalog/`, shown inside `PosView`) — a two-way
  `SegmentedControl` at the top of the till switches **Scan** (today's screen) and
  **Catalog**, remembered per device (`PosMode`). Catalog mode is a search field,
  category chips and a grid of product cards (picture, name, in-stock count,
  price — a range for unit products, per-piece for quantity). A card tap
  (`CatalogPick`, pure): a quantity product goes straight to the cart (a re-tap
  raises it); a unit product with exactly one free unit is added; otherwise the
  unit picker sheet opens. A unit already in the cart is never offered again. Both
  modes feed the **same** cart (`PosCartColumn`); on a phone a persistent cart bar
  (`PosCartBar`) opens the cart + checkout, on an iPad the grid and cart sit side
  by side. Offline, the grid builds from the device + product caches
  (`CatalogOffline`, carried on the sync feed via `imageUrl`/`categoryId` now on
  `DeviceEntity`/`ProductEntity`).
- **Intake code lookup** (`Features/Procurement`, `IntakeLookupSection`) — a
  separate optional "code on the box" field next to the IMEI slots, scannable with
  the camera. A box code (≥ 5 chars) or a full IMEI asks `GET /lookup`: a named
  product is auto-selected and its empty storage/colour filled (`IntakeLookupFill`
  — only empty fields, never overwriting); an unnamed-but-known reference is shown
  for a one-time pick with "remember for next time" (`POST /lookup/links`, admins
  only); an unknown code shows a quiet hint. The lookup is debounced and
  online-only and never blocks or slows saving. `catalog.dataCredit` credits the
  free list where the lookup is used.

DEBUG self-checks: `CatalogSelfCheck` (tap rules — quantity, one unit, several
units, a unit already in the cart — and the offline grid build),
`IntakeLookupFillSelfCheck` (fill only empty fields), `ProductImageEncodeSelfCheck`
(a large image downscales under 2 MB). Run on first POS / catalog / form appear.

DEBUG args added: `-posCatalog 1` (open catalog mode); `-posCatalogPick <modelId>`
(open the unit picker for a product); `-posCatalogAdd "<unitModelId>,<qtyModelId>"`
(seed the cart from the catalog, bar visible); `-posCatalogCart "<u>,<q>"` (seed +
open the cart); `-posSellCatalog "<u>,<q>"` (seed from the catalog and run a real
checkout); `-intakeBox <code>` (prefill the intake box-code field so a capture
shows the found / pick / not-found result).


---

## Appendix: Price levels & discounts (ADR 0034, Change 12/7)

Three price levels — **Walk-in** (RETAIL), **Wholesale**, **Shops** (PARTNER) —
set on the product per storage and overridable per unit. The till's price follows
the customer's type, the seller may switch it, and lowering a price is a
**discount** within the owner's limit (never a free-typed price, unless the user
has `sale.price.override`). A support slice, `Features/Pricing/`, owns the level
codes, the resolved-prices value type, the pure checkout math, the price-manage
repository and the two editor sheets; its README has the details.

| Screen / Sheet | File Path | Role | Description |
| :--- | :--- | :--- | :--- |
| **Product price editor** (`PricingProductSheet`) | `Features/Pricing/UI/PricingProductSheet.swift` | Owner (`price.manage`) | Storage × level grid with an "any storage" row (a quantity product has only that row); saved in one `PUT /pricing/products`. Opened from `ModelFormSheet`. |
| **Unit price editor** (`PricingUnitSheet`) | `Features/Pricing/UI/PricingUnitSheet.swift` | Owner (`price.manage`) | A unit's own three prices (empty = use the product price, with the resolved price shown). Opened from `DeviceSheet`. |
| **Discount sheet** (`PosDiscountSheet`) | `Features/Pos/UI/PosDiscountSheet.swift` | Cashier | Per-line or whole-sale discount: percent/amount as settings allow, preset chips, the final price live, and the `pricing.error…` the server would raise. |

Till changes (`Features/Pos`): `PosCart` is now level- and discount-aware
(`listPrice`/`finalTotal`/`discountAmount`/`validationErrorKey`/`subtotalList`/
`totalDiscount`, plus `applyCartDiscount` which spreads a whole-sale discount over
the lines as per-line AMOUNT discounts that sum exactly). A price-level control
sits next to the customer (`PosCustomerPanel`); each line shows its list and final
price (`PosCartLineRow`); the totals card shows the list total, the discount and
the amount to pay (`PosCheckoutBar`). `PosDiscountConfig` carries the settings +
the user's price permissions. The checkout sends `priceLevelCode`, `discount` and
(offline) the `listPrice` the till used; the server's 400s map to `pricing.error…`.

Other slices: the customer form/row/detail (type + standing discount), the
Discounts settings section (six settings), the consignment form (prefills the
agreed price with the unit's PARTNER price — `pricing.partnerPriceUsed`), sale
detail + the POS receipt (list price / discount / level when non-trivial), the
profit report (`discountsGiven`), and the shipment detail (quantity lines read
from `stockLines` on `GET /shipments/:id`, replacing the session-only list).
Reads carry `prices` into the offline cache (`DeviceEntity`/`ProductEntity`
`pricesJSON`). The "take a photo" button now uses the scanner's VisionKit camera
gate (`CameraPhotoPicker.isAvailable`), so it hides on the Simulator.

DEBUG self-check: `PricingSelfCheck` (price per level; percent + amount discounts;
the cashier cap and the standing discount raising it; a cart discount spread over
three awkward prices that sums exactly; the amount to pay feeding the split).

DEBUG args added: `-posPriceDemo retail|wholesale|lines|over|cart3` (seed a priced
cart); `-posSellDiscount "<code>,<level>,<pct>"` (real discounted checkout);
`-posLevel <level>` (set the till level); `-openModelPrices <id>` (product price
editor); `-openDevicePrices 1` (unit price editor); `-openCustomerForm 1`;
`-openConsignForm <code>` (consign form with the partner price prefilled);
`-openShipmentDetail first`; `-settingsBottom 1` (anchor settings at the discounts
section).

---

### Customer credit (Step 7, ADR 0035)

Sell a cart on credit — **no interest, ever**. Lives in `Features/Credit`; a
finance screen in the More tab (`sale.read`), with the sell flow at the till.

| Screen / Sheet | File | Role | Description |
| :--- | :--- | :--- | :--- |
| **Credits list** (`CreditsView`) | `Features/Credit/UI/CreditsView.swift` | `sale.read` | Status chips (all / open / overdue / paid in full), name/phone search, rows with left-to-pay + an overdue / paid-in-full tag. |
| **Credit detail** (`CreditDetailSheet`) | `Features/Credit/UI/CreditDetailSheet.swift` | `sale.read` | Agreed / paid / left / overdue, goods, plan parts (paid + overdue), payments; take a payment, refund an overpayment (`sale.return`), contract. |
| **Take payment / refund** (`CreditPaymentSheet`) | `Features/Credit/UI/CreditPaymentSheet.swift` | `sale.create` / `sale.return` | One amount + cash/card. A refund caps at the overpaid amount. |
| **Contract** (`CreditContractSheet`) | `Features/Credit/UI/CreditContractSheet.swift` | `sale.read` | The printable contract: store, customer, goods, down payment, plan, no-interest statement. |
| **On-credit sheet** (`CreditSheet`) | `Features/Credit/UI/CreditSheet.swift` | Till (`sale.credit`) | From the till checkout bar: customer debt/limit, cart total, down payment (cash/card/split), plan builder, sell, result. Online only. |

Till (`Features/Pos`): the "On credit" button (`PosCheckoutBar`) is shown when the
setting is on and the user has `sale.credit`; disabled offline. `PosCreditEntry`
builds the cart as `CreditLinePost`s and `PosView` presents `CreditSheet`.

Other slices: the customer form gains a credit-limit field (settings default as
the placeholder); the customer detail shows current debt + overdue and that
customer's credits; a credit sale shows a badge in `SaleDetailSheet` and its
return shows the no-cash note (`ReturnSheet`); Settings gains the credit switch +
default limit; Reports gains the customer-credit tab (`CreditReportTab`).

Permissions now refresh on app start and on foreground (`Session.refreshUser()`
in `RootView`), so a newly granted permission applies without signing out.

DEBUG self-check: `CreditPlanSelfCheck`. DEBUG args: `-open credits`,
`-openCredit first` (first credit's detail), `-posCredit 1` (till credit sheet on a
seeded cart), `-openTab credit` (report tab).

---

### Cashier shifts (Step 8, ADR 0036)

Optional per store (`shiftsEnabled`, off by default). A cashier counts the drawer
cash on opening and closing; the closing difference posts to the balance. Lives in
`Features/Shifts`; the open/close flow is the till bar. Online only.

| Screen / Sheet | File | Role | Description |
| :--- | :--- | :--- | :--- |
| **Shift bar** (`ShiftBar`) | `Features/Shifts/UI/ShiftBar.swift` | Till (`sale.create`) | Open since HH:mm + Close shift, or No open shift + Open shift. Hidden when the setting is off. |
| **Open shift** (`OpenShiftSheet`) | `Features/Shifts/UI/OpenShiftSheet.swift` | `sale.create` | Type the cash counted at the start. |
| **Close shift** (`CloseShiftSheet`) | `Features/Shifts/UI/CloseShiftSheet.swift` | `sale.create` | Expected cash live, counted cash, the difference preview, an optional note; then the report. |
| **Shift report** (`ShiftReportSheet`) | `Features/Shifts/UI/ShiftReportSheet.swift` | `sale.read` | Opening / expected / counted / difference / card total + movements by type with per-account totals. Force-close an open shift with `shift.manage`. |
| **Shifts list** (`ShiftsView`) | `Features/Shifts/UI/ShiftsView.swift` | `sale.read` | Newest first, a date filter, a cashier filter for `shift.manage`. |
| **Force close** (`ForceCloseSheet`) | `Features/Shifts/UI/ForceCloseSheet.swift` | `shift.manage` | Counted cash + a required note for a forgotten open shift. |

Till (`Features/Pos`): the selling gate (`ShiftModel.blocksSale`) — online needs an
open shift (checkout is disabled with a message + Open shift button), offline is
allowed when a shift was open the last time we looked (cached). The server's 409
`NO_OPEN_SHIFT` on `POST /sales` and `POST /credits` maps to the same prompt and
keeps the cart. Settings gains the shifts switch; the `SHIFT_DIFFERENCE`
ledger-type label is added to `BalanceFormat`. Permissions refresh on foreground
(shared with step 7).

DEBUG self-check: `ShiftMathSelfCheck` (−20,000 on an 11,480,000 vs 11,500,000
count). DEBUG args: `-open shifts`, `-openShift first` (first shift's report),
`-posShiftOpen 1`, `-posShiftClose 1` (the till open / close sheets).

### Buying from customers & trade-in (Step 9, ADR 0039)

A second way a unit enters stock: bought from a walk-in customer, or taken in
part payment at the till. Lives in `Features/Purchases`; the till arm is in
`Features/Pos`. **Online only.** **No passport / ID field anywhere** — the
seller is a `Customer` (name + phone).

| Screen | File | Permission | Purpose |
|---|---|---|---|
| **Purchases list** (`PurchasesView`) | `Features/Purchases/UI/PurchasesView.swift` | `purchase.read` | Date filter, IMEI/serial search, rows (seller, model, code, date, price paid when sent, trade-in tag). More tab. |
| **Purchase detail** (`PurchaseDetailSheet`) | `Features/Purchases/UI/PurchaseDetailSheet.swift` | `purchase.read` | Unit, seller (+call), price paid / account (redacted without cost), who / when. |
| **Buy a phone** (`BuyPhoneSheet`) | `Features/Purchases/UI/BuyPhoneSheet.swift` | `purchase.create` | Seller (existing or new name+phone), an IMEI/serial model, identifier (camera scan), the model's attributes, price paid, cash/card. |
| **Trade-in** (`PosTradeInSheet`) | `Features/Pos/UI/PosTradeInSheet.swift` | Till (`purchase.create`) | From the checkout bar: a model + identifier + value. The value lowers what the customer pays; a minus row in the cart, removable. |

Till (`Features/Pos`): the Trade-in action shows only with `purchase.create`,
needs a customer, and is online only (disabled offline). `TradeInAllocation`
(pure, `TradeInAllocationSelfCheck`) places each trade-in — largest first — on
one cart line (price ≥ value), so each sale posts `tradeIns[]` with `payments`
summing to `salePrice − Σ values`; the checkout bar shows `Trade-in −X` and the
amount to pay. A sold line's trade-ins are dropped so a retry never resends them;
a trade-in cart is never queued offline; credit is not offered with a trade-in.
`SaleDetailSheet` / `ReceiptSheet` list the trade-ins and the amount paid; a
return of a sale with a trade-in shows the note and, with `purchase.create`, caps
the refund at money paid + Σ trade-in values (else money paid only). The
`CUSTOMER_PURCHASE` ledger-type label is added to `BalanceFormat` (history +
shift report). A customer-bought unit has no shipment — iOS does not display a
unit's shipment, so nothing breaks (the field is simply absent).

DEBUG self-check: `TradeInAllocationSelfCheck`. DEBUG args: `-open purchases`,
`-openBuyPhone 1` (buy sheet), `-buyModel <modelId>` (preselect a model in the
buy sheet), `-tradeInModel <modelId>` (preselect in the till trade-in sheet).
