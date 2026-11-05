# features/buy-phone

The "Buy a phone" dialog (Change 14, ADR 0039): buy a used phone from a seller.
On success the unit is in stock and goes through the usual QC check.

## Public API

- `BuyPhoneDialog` — seller (existing customer or new name + phone), product
  (IMEI/SERIAL only), its IMEI/serial + attributes, price paid, cash or card.

## Composes (downward only)

- `entities/customer` `CustomerPicker` — the seller.
- `entities/device-model` `UsedUnitFields` + `usedUnitToPayload` — the unit.
- `entities/customer-purchase` `useCreatePurchase` — the write (`purchase.create`).

## Must never

- Ask for passport / document data — the seller is name + phone only.
- Show `pricePaid` where the server omits it (no cost view).
