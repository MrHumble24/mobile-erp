# Shop Order Page

Public order tracking page (`/shop/order/:id`) for storefront customers.

## Responsibilities
- Displays order status, fulfillment details (pickup store or delivery address/zone), frozen price snapshot, delivery fee snapshot, and order total.
- Shows live payment status determined via server verification (`POST /storefront/orders/:id/pay`).
- Polls payment status every 3 seconds for up to 60 seconds when awaiting online payment confirmation.
- Displays "Payment not received yet" alert with "Pay again" action if polling times out.
- Renders a clean 404 state without leaking sensitive personal or order details.
