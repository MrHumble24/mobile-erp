# feature: repair-ticket

Create and edit a repair ticket (`repair.manage`). Composes the `customer`,
`device-model`, `user` and `repair` entities.

## Exposes

- `NewRepairDialog` — pick a customer (existing or name + phone), the device,
  what is broken, the agreed price, the warranty days (typed per ticket), and
  who repairs it (our master = a user, or an outside master = name + phone +
  what we pay). Notes optional.
- `EditRepairDialog` — the same fields (no customer) for a non-terminal ticket.

## Must never

- Offer a field for a phone passcode / pattern or any passport / ID document.
- Default the warranty from settings — it is typed on every ticket.
- Call the repair endpoints directly; it goes through the `repair` entity hooks.
