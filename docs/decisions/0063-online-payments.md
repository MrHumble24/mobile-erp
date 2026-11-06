# 0063. Online Payments (Payme & Click)

## Context
Online orders required an extensible adapter-based payment mechanism supporting Uzbekistan gateways (Payme JSON-RPC 2.0 and Click Shop API) without external payment SDK dependencies. Online payments must hold stock, record money into dedicated cash ledger accounts, and integrate with order cancellation.

## Decision
1. **Pluggable Provider Architecture**: Implemented `OnlinePaymentProvider` interface and `ProviderRegistry` modeled after `BackupStorage`. Native adapters (`PaymeProvider`, `ClickProvider`) use standard Node.js `node:crypto` and `fetch`.
2. **Configuration & Secrets**: Provider status and settings stored in `online_payment_provider_configs`. API keys and merchant secrets stored securely via `SecretsService` (`payment.<provider>.key`). Provider enablement is gated on company currency being `UZS`.
3. **Webhook Protocol & Timing Safety**: Exposed public `@Public()` endpoint `POST /online-payments/callback/:provider` with rate limiting and timing-safe signature verification (`timingSafeEqualString`).
4. **Stock Hold & Expiration**: First successful check/prepare RPC holds serial unit (`IN_STOCK` -> `RESERVED`) under the order. A background cron job cancels `CREATED` payments and unreserved orders older than 12 hours.
5. **Ledger Posting on Hand-over**: Paid orders record sales payment and delivery fee directly to the provider's cash account (`PAYME` or `CLICK`). Hand-over with mismatched accounts is refused. Cancelling a `PAID` order marks payment `REFUND_DUE`.

## Consequences
- Single unified payment callback pipeline for all current and future payment gateways.
- Guaranteed stock availability for paying online customers without double-selling risks.
- Clear financial audit trail in cash ledger with manual refund reconciliation.
