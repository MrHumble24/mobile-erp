# Balance slice

Store money accounts (cash / card), their total, and the full ledger history,
with manual entries. Mirrors the web `balance` feature.

## Owns
- `/ledger/balances`, `/ledger/transactions`, `/ledger/transfers` access
  (`BalanceRepository` — the only file here that touches `APIClient`).
- The balance screen state, filters and paged history (`BalanceModel`).
- Account/type code → i18n key mapping and sign tints (`BalanceFormat`).

## Public API
- `BalanceModule.feature` — registered once in `App/FeatureRegistry.swift`
  (finance group, next to Expenses). Entry: More tab, `nav.balance`, perm
  `balance.read`.

## Invariants
- **Online-only.** Ledger entries are never queued in the offline outbox. The
  screen shows the offline banner; every write sheet refuses while offline.
- Money is a Decimal **string** (`MoneyText`), never a Double. `balances`
  decodes `balance`/`total` whether they arrive as a JSON number or a string.
- Manual entries (`balance.manage`): deposit/withdraw take a positive amount;
  opening/correction take a signed amount (+/- toggle); correction requires a
  note; transfer needs two different accounts. A write reloads balances + history.
- Account/type labels come from the `balance` i18n keys; an unknown code falls
  back to the server-sent `label`, then the raw code.
- Balances may be below zero — shown in the danger colour, never blocked.

## Must never
- Talk HTTP outside `BalanceRepository`; parse money as a Double; queue a write.

## Screenshots (DEBUG)
`-open balance` lands on the screen; `-openBalanceEntry opening|deposit|withdraw|correction|transfer`
opens that entry sheet.
