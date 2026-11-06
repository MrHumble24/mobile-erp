# Manage Storefront Order Feature

Provides lifecycle action controls and dialogs for managing storefront orders by staff.

## Lifecycle Actions
- **Confirm**: From `NEW` to `CONTACTED` (holds an in-stock unit, shows translated error if out of stock).
- **Sent with courier**: From `CONTACTED` to `SHIPPED` (for delivery orders).
- **Hand over**: From `CONTACTED` or `SHIPPED` to `DONE` via `HandOverDialog`:
  - Pay-on-receipt: selects tender method (cash/card/split via `PaymentMethodField`) and delivery fee account.
  - Paid online: displays provider and amount; confirms sale at frozen snapshot price.
- **Cancel**: Releases held phone, updates payment status.
- **Refund**: For cancelled paid orders (`REFUND_DUE`), allows staff with `payment.refund` to record refund reason.
