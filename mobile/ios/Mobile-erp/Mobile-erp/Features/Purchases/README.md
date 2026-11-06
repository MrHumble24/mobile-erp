# Purchases (slice)

Buying used phones from customers, and the till trade-in's purchase side
(Change 14, ADR 0039). A second way a unit enters stock besides a supplier
shipment. **Online only** — there is no outbox path. **No passport or ID field
exists anywhere here, by design**; the seller is a `Customer` (name + phone).

## Owns / exposes

- `PurchaseDTO` (`Data/`): `CustomerPurchaseView` (`pricePaid` redacted without
  `device.cost.view`), the `BuyPhonePayload` write body, and the buy-sheet
  catalog types (`PurchaseModel` + `PurchaseAttr`, IMEI/SERIAL only).
- `PurchasesRepository` (`Data/`): `GET/POST /customer-purchases`, `/:id`, and
  `/device-models` for the buy sheet.
- `PurchasesListModel` (`Model/`): date range + IMEI/serial search, one page.
- `BuyPhoneDraft` (`Model/`): seller + model + identifier + specs + price +
  account, with all validation so the sheet blocks before the server.
- `PurchaseError` (`Lib/`): maps `PURCHASE_UNIT_EXISTS` to `purchases.buyNotSold`, other 409 to `purchases.buyConflict`.
- `PurchasesModule`: the More-tab screen (`purchase.read`).
- UI (`UI/`): `PurchasesView` (list + filter + buy), `PurchaseDetailSheet`,
  `BuyPhoneSheet`, `PurchaseSellerField`, `PurchaseSpecField`.

## Consumed by

- `Features/Pos`: the till trade-in posts `tradeIns[]` on `POST /sales`; its
  i18n lives in the shared `purchases` namespace (`tradeIn*` keys).
- `Features/Sales`: a sale/receipt shows its trade-ins and the amount paid; a
  return of a sale with a trade-in shows the `returnTradeInNote`.

## Must never

- Store or ask for a passport number, document number or ID photo — anywhere.
- Queue a buy or a trade-in for offline replay — both are online only.
- Show `pricePaid` when the server redacted it.
