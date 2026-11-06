# Online Payments Module

Pluggable online payment gateway integration for Storefront orders in Uzbekistan, supporting Payme (JSON-RPC 2.0 Merchant API) and Click (Shop API).

## What It Owns
- Provider configs and enablement (`online_payment_provider_configs`, `online_payment_providers`).
- Merchant secrets resolution via `SecretsService` (`payment.<provider>.key`).
- Gateway webhook callback processing and timing-safe signature verification.
- Payment lifecycle states: `CREATED` -> `PAID` / `CANCELLED` / `REFUND_DUE` -> `REFUNDED`.
- Stock holds on payment initiation (`IN_STOCK` -> `RESERVED`).
- Automatic 12-hour expiration cron for abandoned pending payments and orders.
- Dedicated cash ledger account mapping (`PAYME`, `CLICK`) enforced during order hand-over.

## Public & Staff Routes
| Route | Method | Access | Description |
| --- | --- | --- | --- |
| `/online-payments/callback/:provider` | `POST` | `@Public()` | Gateway callback handler (Payme / Click) |
| `/storefront/orders/:id/pay` | `POST` | `@Public()` | Generate provider checkout redirect URL |
| `/online-payments/configs` | `GET` | Staff (`settings.manage`) | List payment provider configs & secret states |
| `/online-payments/configs/:code` | `GET` | Staff (`settings.manage`) | Get provider config |
| `/online-payments/configs/:code` | `PUT` | Staff (`settings.manage`) | Update provider config (UZS currency gated) |
| `/online-payments/configs/:code/secret` | `POST` | Staff (`settings.manage`) | Store encrypted gateway secret key |
| `/online-payments/configs/:code/check` | `POST` | Staff (`settings.manage`) | Validate provider configuration |
| `/online-payments/payments/:id/refund` | `POST` | Staff (`payment.refund`) | Mark `REFUND_DUE` payment as `REFUNDED` |

## Never-Do List
- **Never** add third-party payment npm SDKs; all gateways use native `fetch` and `node:crypto`.
- **Never** compare authorization tokens or HMAC/MD5 signatures with `===` or `==`; always use `timingSafeEqualString`.
- **Never** permit enabling online payments when the company currency is not `UZS`.
- **Never** post a paid online order's sale or delivery fee to any cash account other than the provider's account (`PAYME` or `CLICK`).
- **Never** delete payment records; online payments are immutable audit events retained across wipes.

## How to Add a Provider in Five Lines
1. Add the lookup code to `server/prisma/schema/online-payments.prisma` and seed SQL.
2. Implement `OnlinePaymentProvider` interface in `src/online-payments/providers/<name>.provider.ts`.
3. Register the new provider class in `OnlinePaymentsModule` and inject it into `ProviderRegistry`.
4. Add the cash account code to `cash_accounts` lookup in `server/prisma/seed.sql` and `online-payments` migration.
5. Provide provider unit tests in `src/online-payments/providers/<name>.provider.spec.ts`.
