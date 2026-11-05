# features/balance — Store Balance

Ports the web `balance` page: the shop's two money accounts (cash, card), their
total, and the ledger of every movement, plus the owner's manual entries.

## Owns
- **Route** `balance` (perm `balance.read`), in the finance nav group next to
  expenses (`nav.balance`). No per-screen title — the shell renders it.
- **Accounts card** (`BalanceAccountsCard`): one `MetricGrid` list-card with a
  row per account and the total. A balance below zero is tinted danger; a
  zero-or-above balance keeps the plain text colour (a positive balance is not a
  profit, so it is not green).
- **History** (`LedgerRow` + the list in `BalanceScreen`): paged newest-first
  (`PageState` + `LoadMoreFooter`), type / account / date / note / author left,
  the signed amount (mono, `signTint` by sign) right. Pull-to-refresh via
  `PullToRefreshBox`. Empty, loading, error and offline states.
- **Filters** (`LedgerFiltersSheet`): account, type, date range — each applies
  immediately. The range goes out as UTC instants bounding the local day
  (`ledgerRangeFrom`/`ledgerRangeTo`), never a bare date.
- **Manual entries** (perm `balance.manage`, `BalanceEntrySheets`): the "+" opens
  a picker → set starting balance / deposit / withdraw / correction (one form,
  rules in `checkEntry`) or transfer (`checkTransfer`). Deposit & withdraw take a
  positive amount; opening & correction take a signed amount; correction needs a
  reason; a transfer needs two different accounts. After a write, balances and
  history reload.

## Public API
`BalanceFeature : FeatureModule` — the only export (one route).

## Must never
- Edit foundation (`core/ data/ shared/ ui/theme/ app/`) or another slice.
- Queue a ledger write offline — every write is online-only and refused with
  `common.offline` when offline (the screen is online-only; it never fakes a
  queued entry).
- Treat money as a float — `balance`/`total` arrive as a number or a string and
  are read through `parseMoney`/`formatMoney` (BigDecimal).

## Notes
- `LedgerApi` is one Retrofit interface built via `container.retrofit.create(...)`.
- Pure logic (`checkEntry`, `checkTransfer`, the number-or-string balance decode)
  is unit-tested in `test/.../balance/BalanceLogicTest.kt`.
- Code → i18n mapping (`ledgerTypeKey`, `ledgerAccountKey`) falls back to the
  server `label` for an unknown code, so new server types render with no change.
  `DEVICE_EXPENSE` and `CUSTOMS` (ADR 0026/0027) are mapped and in the type filter.
- `LedgerTxn.amount` is nullable: the server sends `null` on a cost-type row for a
  caller without `device.cost.view` (ADR 0028), and `LedgerRow` shows
  `balance.amountHidden` instead of a figure. Decoding a null amount is unit-tested
  in `test/.../balance/LedgerAmountDecodeTest.kt`.
- Left out (simplest correct option, no server/kit support needed): the optional
  `occurredAt` date input (entries default to now; the kit ships no single-date
  field) and a split From/To filter (one range field instead). `balance.date`,
  `balance.filterFrom`/`filterTo`, `balance.paidWith`/`pay*`/`split*` keys are
  unused by the app.
