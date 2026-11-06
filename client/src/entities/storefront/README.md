# Storefront Entity

Provides queries and mutations for the public online storefront and company-wide storefront settings.

## Exports
- `useStorefrontConfig`: Reads public shop configuration and active branches.
- `useStorefrontProducts`: Reads in-stock products across active branches with optional category/search filters.
- `useStorefrontProduct`: Reads detailed variants and branch inventory for a device model.
- `useCreateStorefrontOrder`: Places an unauthenticated customer order with honeypot support.
- `useStorefrontSettings`, `useUpdateStorefrontSettings`: Staff hooks for company-wide storefront settings.
