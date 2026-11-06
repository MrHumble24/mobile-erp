# Storefront Entity

Provides queries and mutations for the public online storefront, delivery zones, order payment, and storefront settings.

## Exports
- `useStorefrontConfig`: Reads public shop configuration, delivery options, and payment provider codes.
- `useStorefrontProducts`: Reads in-stock products across active branches with optional category/search filters.
- `useStorefrontProduct`: Reads detailed variants and branch inventory for a device model.
- `useCreateStorefrontOrder`: Places an unauthenticated customer order with honeypot, fulfillment, and payment method.
- `usePublicOrder`: Fetches public order status and frozen snapshots for `/shop/order/:id`.
- `usePayStorefrontOrder`: Retrieves checkout URL for an online payment order.
- `useStorefrontSettings`, `useUpdateStorefrontSettings`: Staff hooks for storefront settings.
- `useDeliveryZones`, `useCreateDeliveryZone`, `useUpdateDeliveryZone`, `useDeleteDeliveryZone`: Staff hooks for delivery zone management.
