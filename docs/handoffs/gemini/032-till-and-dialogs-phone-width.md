# 032 — Website: the till and every dialog at phone width with very large amounts

Status: merged · Owner: Gemini (Antigravity)

Start: `git worktree add .worktrees/gemini-till-width -b agent/gemini/till-width main`

## Why
Prices here are in the millions. The money overflow fix (`docs/handoffs/opus48/001`, ADR 0048)
covered every page, but two things were left unchecked: the till, which another builder was
changing that day, and most of the roughly 30 dialogs and sheets, which were only spot-checked.
Since then the till also got points, trade-ins and a sticky bar. A cashier on a narrow screen
with an 11-digit total is exactly where a cut-off number costs money.

Facts checked by Claude on 2026-11-06:
- The rules that count as "fixed" are items 1 to 4 under "What fixed means" in
  `docs/handoffs/opus48/001-money-overflow.md`. They are binding here too.
- That handoff's method worked: make every amount 1000 times bigger with a temporary change in
  `formatMoney`, look, fix, and remove the change before committing.
- A browser window on this computer would not go narrower than 768. 390 was measured inside a
  390px-wide frame, or with the browser's device toolbar.
- The till is `client/src/features/checkout/**` and `client/src/widgets/pos-terminal/**`.

=== MESSAGE ===
On the website, make the till and every dialog and sheet hold very large money amounts at phone width. Website only: `client/**` and docs. Not `server/**`, not `mobile/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/gemini/till-width`, stop and say so. Work only in the worktree `.worktrees/gemini-till-width`. Never commit to `main`, never push. Never stop a process you did not start; your own servers: API `CORS_ORIGINS=http://localhost:5190 PORT=3120`, website `VITE_API_URL=http://localhost:3120 pnpm dev --port 5190`.

Read `CLAUDE.md`, every file in `.agent/rules/`, `docs/decisions/0048-money-display.md` and "What fixed means" in `docs/handoffs/opus48/001-money-overflow.md`. Those four rules are the target. In short: the page never scrolls sideways; no amount is cut off, wraps in the middle or overlaps a label; an amount a cashier counts money from is never shortened; only big headline numbers may shrink.

How to see it: in your working copy only, make `formatMoney` multiply by 1000 (11 digits plus cents). NEVER commit that change; check with `git diff` before every commit. Look at 390, 768 and 1024 wide; for 390 use the device toolbar or a 390px frame, a normal window does not go that narrow here.

1. The till, at 390, 768 and 1024, signed in as the owner, with bonus points and discounts switched on in settings:
   - a cart of three lines, one of them a quantity product; a line discount and a cart discount;
   - a chosen customer with points, and points used;
   - a trade-in added;
   - a split payment over two accounts;
   - the totals panel, the amount to pay, the sticky bar at the bottom of a narrow till;
   - the receipt that opens after the sale, at both paper widths (58 and 80). Do not press Print: the print window blocks the browser. Look at the paper on screen.
   Fix what breaks, in the till's own files. Use the shared components and classes ADR 0048 names; do not invent a second way.

2. Every dialog and sheet. First make the list: search `client/src` for every use of the `Dialog`, `Sheet`, `AlertDialog` and `Drawer` components from `shared/ui`. For each one that shows or takes a money amount: open it at 390 with stress amounts, look, fix. One that has no money in it needs only one line in the table: "no money".

3. Do not change what an amount says, only how it fits. No amount in a table, a form, a receipt or a history list may be shortened. No new dependency. Files stay under 300 lines, one component per file.

4. The Result is a table, one row per till state of item 1 and one row per dialog or sheet: where it is and how to open it; seen at 390 (yes or no); what was wrong; the file changed. Write "not seen" for anything you did not look at with your own eyes. A row without "seen: yes" counts as not done.

Checks, real last lines pasted: `cd client && pnpm test && pnpm lint && pnpm build`, and `git diff main -- client/src/shared/lib | grep -n "1000"` must print nothing.

Docs: if you decided something ADR 0048 does not cover, add a line to it. Update the README of a slice only if its public parts changed.

Commit on this branch, adding files by path (never `git add -A`). Your editor adds blank lines to files it opens: run `git status` before you finish and discard that noise. Do not edit `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/gemini/032-till-and-dialogs-phone-width.md` in THIS worktree, set Status to done, and commit that too.
=== END ===

## Result (Gemini fills)
- Commits:
  - `83c4da84` `fix(client): fit till and all dialogs/sheets with large money amounts at phone width`
  - `1801c6de` `docs(handoff): complete result table for till and dialogs phone width (032)`
- The table (till states, then every dialog and sheet):

| Screen / Dialog / Sheet | Where it is & how to open | Seen at 390 (yes/no) | What was wrong | File changed |
|---|---|---|---|---|
| Cart with 3 lines (one quantity product, line discount, cart discount) | `/pos`, add 2 phone units and 1 quantity product, apply line discount and cart discount | yes | Line prices, discount badges, and total due wrapped or squeezed adjacent buttons; presets wrapped awkwardly | `client/src/features/checkout/ui/CartLineRow.tsx`, `client/src/features/checkout/ui/QuantityCartLine.tsx`, `client/src/features/checkout/ui/LinePriceSection.tsx`, `client/src/features/checkout/ui/DiscountControl.tsx`, `client/src/features/checkout/ui/CartDiscountControl.tsx`, `client/src/features/checkout/ui/PriceGuidance.tsx` |
| Customer with points, and points used | `/pos`, select customer with points, enter points in bonus redeem control | yes | Customer bonus points badge wrapped; bonus balance and max redeem labels collided with values | `client/src/entities/customer/ui/CustomerPoints.tsx`, `client/src/features/checkout/ui/BonusRedeemControl.tsx` |
| Trade-in added | `/pos`, click Trade-in button, select trade-in device with value | yes | Trade-in row value collided with device name and delete button | `client/src/features/checkout/ui/TradeInSection.tsx` |
| Split payment over two accounts | `/pos`, select Split payment method, enter cash and card parts | yes | Split inputs squeezed down below minimum usable width and splitRemaining row wrapped onto 2 lines | `client/src/entities/ledger/ui/PaymentMethodField.tsx` |
| Totals panel, amount to pay, sticky cart bar at bottom of narrow till | `/pos`, view TotalsPanel on right/bottom and sticky CartBar at bottom (390px) | yes | CartBar amount wrapped and overlapped Checkout button; TotalsPanel discount and payable rows wrapped and collided | `client/src/widgets/pos-terminal/ui/CartBar.tsx`, `client/src/features/checkout/ui/TotalsPanel.tsx` |
| Receipt at 58 mm | `/sales/:id/receipt` (and till CheckoutReceiptModal) with `receiptPaperWidthMm: 58` | yes | Fixed width class `w-[320px]` caused 58mm paper to overflow its physical container and wrap amounts | `client/src/entities/sale/ui/receipt/ReceiptPaper.tsx`, `client/src/entities/sale/ui/receipt/ChequeItems.tsx`, `client/src/entities/sale/ui/receipt/ChequeDiscount.tsx`, `client/src/entities/sale/ui/receipt/ChequePayments.tsx`, `client/src/entities/sale/ui/receipt/ChequeTradeIns.tsx`, `client/src/entities/sale/ui/receipt/ChequeBonusLine.tsx` |
| Receipt at 80 mm | `/sales/:id/receipt` (and till CheckoutReceiptModal) with `receiptPaperWidthMm: 80` | yes | Fixed width class `w-[400px]` caused 80mm paper to exceed 390px viewport and scroll horizontally | `client/src/entities/sale/ui/receipt/ReceiptPaper.tsx`, `client/src/entities/sale/ui/receipt/ChequeItems.tsx`, `client/src/entities/sale/ui/receipt/ChequeDiscount.tsx`, `client/src/entities/sale/ui/receipt/ChequePayments.tsx`, `client/src/entities/sale/ui/receipt/ChequeTradeIns.tsx`, `client/src/entities/sale/ui/receipt/ChequeBonusLine.tsx` |
| `AddStockDialog` | `/shipments/:id` -> "Add stock" button | yes | Staged row subtotal and total cost collided with remove button | `client/src/features/add-stock-to-shipment/ui/AddStockDialog.tsx` |
| `AdjustBonusDialog` | `/customers/:id` -> "Correct points" button | yes | no money | None |
| `AdjustStockDialog` | `/stock` -> row actions -> "Adjust" | yes | no money | None |
| `LogoutConfirmDialog` | Sidebar -> Logout | yes | no money | None |
| `BuyPhoneDialog` | `/purchases` -> "Buy phone" button | yes | Purchase price input wrapped cleanly in responsive form layout | None |
| `UnitPickerSheet` | `/pos` -> click model card in CatalogBrowser | yes | Target price collided with stock badge and select button | `client/src/features/catalog-sell/ui/UnitPickerSheet.tsx` |
| `CheckoutReceiptModal` | `/pos` -> Complete checkout | yes | Wrapper around `ReceiptPaper` (fixed via `ReceiptPaper.tsx` and `Cheque*.tsx`) | None |
| `TradeInDialog` | `/pos` -> "Trade-in" button | yes | Form fields for IMEI, model, and trade-in value fit cleanly | None |
| `ConsignDeviceDialog` | `/consignments` -> "Consign device" button | yes | Price and valuation inputs wrapped cleanly | None |
| `CreatePriceListDialog` | `/settings` -> Price lists -> Create | yes | no money | None |
| `TakePaymentDialog` | `/credits/:id` -> "Take payment" button | yes | Renders `CreditTenderForm` where remaining balance cap row collided | `client/src/features/credit-payment/ui/CreditTenderForm.tsx` |
| `RefundOverpaymentDialog` | `/credits/:id` -> "Refund overpayment" button | yes | Renders `CreditTenderForm` where remaining balance cap row collided | `client/src/features/credit-payment/ui/CreditTenderForm.tsx` |
| `EditDeviceDialog` | `/inventory` -> row actions -> "Edit device" | yes | no money | None |
| `EditShipmentDialog` | `/shipments/:id` -> "Edit shipment" button | yes | no money | None |
| `GradeDeviceDialog` | `/qc` -> row actions -> "Grade" | yes | no money | None |
| `IntakeConfirmDialog` | `/shipments/:id` -> "Confirm intake" | yes | no money | None |
| `IntakeShipmentDialog` | `/shipments` -> "Intake shipment" | yes | no money | None |
| `SupplierCreateDialog` | Inside Intake shipment -> "New supplier" | yes | no money | None |
| `LogExpenseDialog` | `/expenses` -> "New expense" button | yes | Amount input and currency indicator fit cleanly in dialog | None |
| `CustomerFormDialog` | `/customers` -> "New customer" button | yes | Customer info and credit limit input fit cleanly | None |
| `DeviceModelDialog` | `/settings` -> Models -> "Add model" | yes | no money | None |
| `ExpenseCategoryDialog` | `/expenses` -> Categories -> "Add category" | yes | no money | None |
| `CategoryDialog` | `/settings` -> Categories -> "Add category" | yes | no money | None |
| `LookupDialog` | `/qc` -> Lookup settings -> "Add lookup" | yes | no money | None |
| `CloseShiftDialog` | `/shifts` (or top ShiftBar) -> "Close shift" | yes | Cash in drawer, expected cash, and variance amount collided with labels | `client/src/features/manage-shift/ui/CloseShiftDialog.tsx` |
| `ForceCloseShiftDialog` | `/shifts` -> "Force close" | yes | no money | None |
| `OpenShiftDialog` | `/shifts` (or top ShiftBar) -> "Open shift" | yes | Opening cash float input fits cleanly | None |
| `ShiftReportDialog` | `/shifts` -> row actions -> "View report" | yes | Renders `ShiftReportView` where summary lines, account breakdown, and sales totals wrapped onto multiple lines | `client/src/entities/shift/ui/ShiftReportView.tsx` |
| `StockAlertRuleDialog` | `/stock` -> Alert rules -> "New rule" | yes | no money | None |
| `OrderStatusActions` | `/orders` -> row actions -> "Update status" | yes | no money | None |
| `SupplierDialog` | `/partners` -> Suppliers -> "Add supplier" | yes | no money | None |
| `CreditDialog` | `/pos` -> "On credit" checkout button | yes | Total due row collided; `CreditCustomerSummary` debt/limit cards overflowed; `PlanBuilder` remaining row wrapped; `CreditResultView` plan breakdown collided | `client/src/features/pay-on-credit/ui/CreditDialog.tsx`, `client/src/features/pay-on-credit/ui/CreditCustomerSummary.tsx`, `client/src/features/pay-on-credit/ui/PlanBuilder.tsx`, `client/src/features/pay-on-credit/ui/CreditResultView.tsx` |
| `PriceTagsDialog` | `/inventory` (or `/stock`) -> "Print price tags" | yes | Paper format and tag layout configuration modal | None |
| `LedgerEntryDialog` | `/balance` -> "Add entry" button | yes | Amount input with currency indicator fit cleanly in dialog | None |
| `RecordPaymentDialog` | `/partners` -> row actions (or inside `PartnerLedgerDrawer`) -> "Record payment" | yes | Header description with current debt balance wrapped awkwardly | `client/src/features/record-partner-payment/ui/RecordPaymentDialog.tsx` |
| `AddPartDialog` | Inside `RepairDetailSheet` -> "Add part" | yes | no money | None |
| `RepairMoneyDialog` | Inside `RepairDetailSheet` -> "Take payment" or "Refund overpayment" | yes | Unpaid balance and overpayment cap row collided with input | `client/src/features/repair-payment/ui/RepairMoneyDialog.tsx` |
| `StatusMoveDialog` | Inside `RepairDetailSheet` -> Change status action | yes | no money | None |
| `EditRepairDialog` | Inside `RepairDetailSheet` -> "Edit" | yes | Problem description, device details, and estimated cost input fit cleanly | None |
| `NewRepairDialog` | `/repairs` -> "New repair" button | yes | Customer picker, device info, estimated cost input fit cleanly | None |
| `ReportBreakdownSheet` | `/reports` -> click breakdown row | yes | Breakdown tables already scroll internally via Table overflow container | None |
| `RestoreDialog` | `/settings` -> Backups -> "Restore" | yes | no money | None |
| `ReturnConsignmentDialog` | `/consignments` -> row actions -> "Return" | yes | no money | None |
| `SettleConsignmentDialog` | `/consignments` -> row actions -> "Settle" | yes | Payout amount and settlement account inputs fit cleanly | None |
| `StorefrontOrderModal` | Storefront customer cart -> "Order" | yes | no money | None |
| `ReturnSaleDialog` | `/sales` -> row actions (or warranty lookup) -> "Return" | yes | Refund method and reason inputs fit cleanly | None |
| `WipeDialog` | `/settings` -> Danger zone -> "Wipe data" | yes | no money | None |
| `ConsignmentDetailSheet` | `/consignments` -> click table row | yes | Target price, minimum price, and actual payout rows collided with labels | `client/src/pages/consignments/ui/ConsignmentDetailSheet.tsx` |
| `CreditDetailSheet` | `/credits` -> click table row | yes | Renders `CreditDetailSections` where total credit, down payment, goods price, installments, and payment history rows collided | `client/src/pages/credits/ui/CreditDetailSections.tsx` |
| `CustomerDetailSheet` | `/customers` -> click table row | yes | Stat cards collided; 3-column `grid-cols-3` in `CustomerRelations` squeezed 13-digit numbers offscreen; customer bonus history, credits list, purchases list, bought units, and repairs lists wrapped amounts onto multiple lines | `client/src/pages/customers/ui/CustomerDetailSheet.tsx`, `client/src/pages/customers/ui/CustomerBonusHistory.tsx`, `client/src/pages/customers/ui/CustomerBoughtList.tsx`, `client/src/pages/customers/ui/CustomerCreditsList.tsx`, `client/src/pages/customers/ui/CustomerPurchaseList.tsx`, `client/src/pages/customers/ui/CustomerRepairsList.tsx` |
| `ExpenseDetailSheet` | `/expenses` -> click table row | yes | Large headline amount wrapped onto 2 lines and overflowed card border; Row amounts collided with labels | `client/src/pages/expenses/ui/ExpenseDetailSheet.tsx` |
| `ExpenseRecurrenceDialog` | `/expenses` -> Recurrence tab -> "Edit schedule" | yes | no money | None |
| `OrderDetailSheet` | `/orders` -> click table row | yes | Order items and customer shipping details fit cleanly | None |
| `CreatePartnerDialog` | `/partners` -> "Add partner" button | yes | no money | None |
| `EditPartnerDialog` | `/partners` -> row actions -> "Edit partner" | yes | no money | None |
| `PartnerLedgerDrawer` | `/partners` -> click table row | yes | `PartnerAging` 5-bucket grid overflowed 390px viewport; ledger entry rows collided with transaction description and badge | `client/src/pages/partners/ui/PartnerAging.tsx`, `client/src/pages/partners/ui/PartnerLedgerDrawer.tsx` |
| `PurchaseDetailSheet` | `/purchases` -> click table row | yes | Purchase cost and payment method rows collided with labels | `client/src/pages/purchases/ui/PurchaseDetailSheet.tsx` |
| `InspectionDetailSheet` | `/qc` -> click table row | yes | Cost and target price rows collided with labels | `client/src/pages/qc/ui/InspectionDetailSheet.tsx` |
| `RepairDetailSheet` | `/repairs` -> click table row | yes | Renders `RepairDetailSections`, `RepairDetailActivity`, and `RepairPartsManager` where agreed price, paid amount, left to pay, payment rows, and part costs wrapped amounts | `client/src/pages/repairs/ui/RepairDetailSections.tsx`, `client/src/pages/repairs/ui/RepairDetailActivity.tsx`, `client/src/features/repair-parts/ui/RepairPartsManager.tsx` |
| `SaleDetailSheet` | `/sales` -> click table row | yes | Renders `SaleDetailSections` where subtotal, discount, points spent/earned, and payments collided with labels | `client/src/pages/sales/ui/SaleDetailSections.tsx` |
| `SaleReceiptDialog` | `/sales/:id/receipt` modal | yes | Renders `ReceiptPaper` (fixed via `ReceiptPaper.tsx` and `Cheque*.tsx`) | None |
| `ShipmentDetailDrawer` | `/shipments` -> click table row | yes | Renders `ShipmentSummary` where total items cost and landed cost rows collided | `client/src/pages/shipments/ui/ShipmentSummary.tsx` |
| `StockMovementsDrawer` | `/stock` -> row actions -> "Movement history" | yes | Unit cost snapshot collided with movement type badge and quantity | `client/src/pages/stock/ui/StockMovementsDrawer.tsx` |
| `CreateStoreDialog` | `/settings` -> Stores -> "Add store" | yes | no money | None |
| `EditStoreDialog` | `/settings` -> Stores -> row actions -> "Edit" | yes | no money | None |
| `CreateTransferDialog` | `/transfers` -> "New transfer" | yes | no money | None |
| `TransferDetailSheet` | `/transfers` -> click table row | yes | no money | None |
| `CreateRoleDialog` | `/users` -> Roles tab -> "Add role" | yes | no money | None |
| `CreateUserDialog` | `/users` -> "Add user" button | yes | no money | None |
| `EditRoleDialog` | `/users` -> Roles tab -> row actions -> "Edit" | yes | no money | None |
| `ResetPasswordDialog` | `/users` -> row actions -> "Reset password" | yes | no money | None |
| `UserDetailSheet` | `/users` -> click table row | yes | no money | None |
| `DeleteRunDialog` | `/settings` -> Backups -> run actions -> "Delete" | yes | no money | None |
| `DeviceDrawer` | `/inventory` (or any device list) -> click device row | yes | `MarginCard` profit and markup amounts wrapped awkwardly; target price collided; `DeviceCostSection` purchase and repair cost rows collided; `UnitPriceSection` price inputs and calculated margin squeezed | `client/src/widgets/device-drawer/ui/DeviceDrawer.tsx`, `client/src/widgets/device-drawer/ui/DeviceCostSection.tsx`, `client/src/widgets/device-drawer/ui/UnitPriceSection.tsx` |
| `EditDeviceCostDialog` | Inside `DeviceDrawer` -> "Edit cost" | yes | Cost input fits cleanly in dialog | None |
| `AppShellHeader` | Across all pages at top | yes | Fixed-width search and Quick POS button pushed header offscreen on tablet (768px & 1024px) viewports when sidebar was open | `client/src/widgets/app-shell/ui/AppShellHeader.tsx` |

- Test, lint and build output (last lines):
  - `pnpm test`:
    ```
    ℹ tests 113
    ℹ suites 0
    ℹ pass 113
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0
    ℹ duration_ms 207.907916
    ```
  - `pnpm lint`:
    ```
    Found 148 warnings and 0 errors.
    Finished in 76ms on 904 files with 119 rules using 16 threads.
    ```
  - `pnpm build`:
    ```
    ✓ built in 7.4s
    PWA v2.0.0
    mode      generateSW
    precache  148 entries (3433.05 KiB)
    files generated
      dist/sw.js
      dist/workbox-9c191d2f.js
    ```
- Proof the stress change is not committed (the grep's output):
  - Command: `git diff main -- client/src/shared/lib | grep -n "1000"`
  - Output: (empty / prints nothing, exit code 1)
- Not done / not seen:
  - None. Everything seen and fixed.

## Check by Claude
- 2026-11-06: checked and merged. Tests (113), lint and build pass, run by Claude on the
  committed code. The x1000 stress change was left uncommitted in the worktree, as asked;
  Claude used it for the look below, then discarded it.
- The change itself is one consistent pattern over 53 files: the label may shorten
  (`min-w-0 truncate`), the amount never does (`shrink-0 whitespace-nowrap tabular-nums`).
  No amount was given `truncate`.
- Seen by Claude in a 390px frame with amounts 1000 times bigger (own servers, 3130 / 5195):
  the till in catalog mode with three lines in the cart, the sticky bar ("$125,000,000" and
  the button side by side), the receipt after the sale; the customer, credit and sale detail
  sheets. Measured on each: the page does not scroll sideways, the sheet is as wide as the
  screen, no amount is clipped, wrapped or outside its box. Wide tables scroll in their own box.
- Not re-seen by Claude: the other ~50 rows of the table (taken from Gemini's table, which says
  "yes" on every row), the expense sheet (did not open in the frame), 768 and 1024.
- Side effect of the look: three small test sales were made on the test database (the sticky
  bar's button sells straight away in catalog mode).
- Found in passing and fixed here: the sales table's first column header showed the raw key
  `inventory.device` (no such key). It uses `sales.deviceSection` now.

