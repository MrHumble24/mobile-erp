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
| **POS Terminal** (`PosView`) | `Features/Pos/UI/PosView.swift` | Cashier / Sales | Fast IMEI scan via hardware scanner or camera ([`ScannerField`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Shared/UI/ScannerField.swift)), live device spec/price verification, and checkout trigger. Supports offline queuing. |
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
| **Device Detail Sheet** (`DeviceSheet`) | `Features/Inventory/UI/DeviceSheet.swift` | All Staff | Bottom sheet showing barcode, full technical specifications, QC history, acquisition cost (permission-gated), and status change actions. |
| **Warranty Lookup** (`WarrantyLookupSheet`) | `Features/Sales/UI/WarrantyLookupSheet.swift` | Cashier / Support | Quick IMEI/phone number lookup to verify active warranty coverage and initiate warranty claims. |

---

### Tier 2: Shift Operations & Batch Workflows (Daily / Per-Shipment)
*Screens used at shift starts/ends, upon receiving overseas shipments, and during daily closing.*

| Screen / Sheet | File Path | Primary Role | Description & Workflow |
| :--- | :--- | :--- | :--- |
| **Dashboard** (`DashboardView`) | `Features/Dashboard/UI/DashboardView.swift` | Owner / Manager | Visual hub showing today's revenue, profit margins, overdue consignment alerts ([`OverdueCard`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Dashboard/UI/DashboardLists.swift)), and low stock warnings ([`LowStockCard`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Dashboard/UI/DashboardLists.swift)). |
| **Shipments List** (`ShipmentsListView`) | `Features/Procurement/UI/ShipmentsListView.swift` | Inventory Lead | Batch procurement registry displaying overseas shipments, landing dates, and supplier details. |
| **Shipment Form** (`ShipmentFormSheet`) | `Features/Procurement/UI/ShipmentFormSheet.swift` | Inventory Lead | Create shipment batch and record bulk freight/customs overhead expenses for automatic landed-cost distribution. |
| **Device Intake Flow** (`IntakeSheet`) | `Features/Procurement/UI/IntakeSheet.swift` | Inventory Specialist | Multi-device intake screen for scanning newly arrived IMEIs, setting unit base costs, and generating barcodes. |
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
| **Financial Reports** (`ReportsView` → `FinOverviewTab`) | `Features/Reports/UI/ReportsView.swift`, `Features/Reports/UI/OverviewTab.swift` | Store Owner | Revenue, COGS, gross profit and net operating income with a day/week/month trend chart and channel breakdown. |
| **Expense Analytics** (`ExpensesReportTab`) | `Features/Reports/UI/ExpensesReportTab.swift` | Store Owner | Breakdown of overhead spending by category and recurring vs one-off analysis. |
| **Store Balance** (`BalanceView`) | `Features/Balance/UI/BalanceView.swift` | Store Owner | Cash and card money accounts with their total, and the full ledger history (paged, newest first) filtered by account/type/date. Balances may be below zero (shown in danger). Online-only. Entry: More tab, perm `balance.read`. |
| **Balance Entry Sheet** (`BalanceEntrySheet`) | `Features/Balance/UI/BalanceEntrySheet.swift` | Store Owner | Manual ledger entry — set starting balance, deposit, withdraw, correction (signed amount + reason) — gated on `balance.manage`. |
| **Balance Transfer Sheet** (`BalanceTransferSheet`) | `Features/Balance/UI/BalanceTransferSheet.swift` | Store Owner | Move money between two different accounts (`balance.manage`). |
| **Balance Filter Sheet** (`BalanceFiltersSheet`) | `Features/Balance/UI/BalanceFiltersSheet.swift` | Store Owner | Bottom sheet with account, type and date-range filters for the ledger history. |
| **Model Pricing Benchmarks** (`ModelPricingTab`) | `Features/Reports/UI/ModelPricingTab.swift` | Store Owner | Setting model benchmark prices, target margins, and minimum allowable selling prices. |
| **Customer CRM** (`CustomersView`) | `Features/Customers/UI/CustomersView.swift` | Sales / Owner | Customer directory with purchase history filter and detail sheet ([`CustomerDetailSheet`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Customers/UI/CustomerDetailSheet.swift)). |
| **Customer Filter Sheet** (`CustomerFilterSheet`) | `Features/Customers/UI/CustomerFilterSheet.swift` | Sales / Owner | Bottom sheet housing customer sort order (recent vs alphabetical) and purchase history toggle. |
| **Catalog Models** (`DeviceModelsTab`) | `Features/Inventory/UI/DeviceModelsTab.swift` | Inventory Lead | Managing phone catalog definitions and dynamic attribute schemas via [`AttributesEditor`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Inventory/UI/AttributesEditor.swift). |
| **Stock Alert Rules** (`StockAlertsTab`) | `Features/Inventory/UI/StockAlertsTab.swift` | Inventory Lead | Configuring minimum inventory reorder thresholds per model ([`AlertRuleForm`](file:///Users/abdulboriymalikov/projects/mobile-erp/mobile/ios/Mobile-erp/Mobile-erp/Features/Inventory/UI/AlertRuleForm.swift)). |
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
`GET /ledger/balances` when the user has `balance.read`, else the two known codes
`CASH`/`CARD` (cashiers).

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
| **Sale Return** (`ReturnSheet`) | One read-only line naming the account(s) the refund returns to. |
| **Expenses** (`LogExpenseSheet`, `ExpenseDetailSheet`, rows) | Account picker (default Cash); detail + rows show the account. |
| **Recurring Expense** (`ExpenseRecurrenceSheet`) | Account picker (default Cash). |
| **Partner Payment** (`RecordPaymentSheet`) | Account picker (default Cash). Note: the partner ledger endpoint does not carry the account, so history cannot show it yet. |
| **Shipment Form / Detail** (`ShipmentFormSheet`, `ShipmentDetailSheet`) | "Paid from" picker on create (default Cash), read-only afterwards. |
| **Store Balance** (`BalanceView`) | History already renders the automatic types (`SALE`, `REFUND`, `PARTNER_PAYMENT`, `PURCHASE`, `OVERHEAD`, `EXPENSE`) and offers them in the type filter; `balance`/`total` decode from number or decimal string. |

DEBUG screenshot args added: `-posDemo cash|split` (seeds a demo checkout line),
`-openExpense new`, `-openShipmentForm new`, `-openPartnerPayment 1`.

