# 0064 — Client Shop Checkout, Delivery, Online Payments & Staff Workflows

Date: 2026-11-07
Status: Accepted

## Context
Online shop part 2 enables delivery orders, device reservations, online payments (Payme, Click), and staff order handovers. The website needed the customer checkout, payment redirect and polling, public order tracking, and staff management screens.

## Decision
- **Customer Checkout**: Modal supports pickup and delivery with address and zone picker. Delivery fee is computed by a pure tested function matching server logic.
- **Payment Method Selection**: "Pay when I receive it" or online gateways. Products with "ask" price hide online payments. Online payment redirects to the server-issued checkout URL; never constructs URLs in the browser.
- **Public Order Page (`/shop/order/:id`)**: Shows order status, fulfillment, frozen price, and fee snapshot without leaking personal data. If unpaid online, polls server every 3s for 60s; on timeout shows a retry action.
- **Staff Settings**: Added `StorefrontDeliverySection` (pickup, delivery, pricing modes, free-from, zones manager) and `StorefrontPaymentSection` (cards with test mode, secrets management dialog, callback URL copy, and connection check).
- **Staff Orders Workflow**: Extended orders table and detail sheet with fulfillment, fee, and payment details. Staff can confirm (holds unit, handles out of stock), ship, hand over (reusing `PaymentMethodField` for on-receipt; auto-assigning for online), and refund cancelled paid orders (`payment.refund`).
- **Translations**: Fully localized in English and Uzbek (Latin) following the glossary.

## Consequences
- Clean separation of public and authenticated surfaces.
- All server error codes mapped to translated UI feedback via `httpErrorCode`.
- Files kept <= 300 lines and functions <= 50 lines.
