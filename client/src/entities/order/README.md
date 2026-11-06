# Storefront Order Entity

Provides data access, models, and UI badges for storefront order management scoped to active branch.

## Exports
- `useStorefrontOrders`: Queries orders list with status/date filters for the active branch.
- `useStorefrontOrderStats`: Polled stats query returning unhandled (`new`) orders count.
- `useStorefrontOrder`: Queries single order detail with status change history, delivery, and payment info.
- `useUpdateOrderStatus`: Mutation for status transitions (CONTACTED, SHIPPED, DONE, CANCELLED).
- `useHoldOrder`: Mutation to reserve a device unit for an order.
- `useHandOverOrder`: Mutation to execute sale handover with tender breakdown and delivery fee account.
- `OrderStatusBadge`: Colored status indicator badge.
- `allowedOrderTransitions`, `isOrderTerminal`, `canTransitionOrder`: Status move validators.
