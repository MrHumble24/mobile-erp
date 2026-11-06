# Storefront Order Entity

Provides data access and UI badges for staff storefront order management scoped to active branch.

## Exports
- `useStorefrontOrders`: Queries orders list with status/date filters for the active branch.
- `useStorefrontOrderStats`: Polled stats query returning unhandled (`new`) orders count.
- `useStorefrontOrder`: Queries single order detail with status change history.
- `useUpdateOrderStatus`: Mutation for status transitions (CONTACTED, DONE, CANCELLED).
- `OrderStatusBadge`: Colored status indicator badge.
