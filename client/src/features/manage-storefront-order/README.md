# Manage Storefront Order Feature

Provides action buttons for updating staff storefront order status.

## Lifecycle Actions
- Transition from `NEW` to `CONTACTED`.
- Transition from `CONTACTED` to `DONE`, optionally associating the order with a sale ID.
- Cancellation from `NEW` or `CONTACTED`.
- Terminal statuses (`DONE`, `CANCELLED`) display no further transition actions.
