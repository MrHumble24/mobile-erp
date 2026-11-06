# Storefront Order Feature

Modal dialog and checkout form enabling customers to place orders on the public storefront.

## Capabilities
- Gathers customer name, phone, chosen branch or delivery address/zone, and optional note.
- Supports pickup at available branches and address delivery.
- Pure calculation of delivery fees (flat, by zone, free from threshold) matching server logic.
- Payment choice: pay on receipt or online gateways (Payme, Click).
- Directs online orders to the server-issued checkout URL.
- Implements bot honeypot field (`hp`) silently accepted and dropped by server.
- Shows clear error messages for out-of-stock and rate-limiting responses.
- Shows order success view with link to public order tracking page.
