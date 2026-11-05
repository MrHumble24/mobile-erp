# manage-customer

One feature: create or edit a customer (PRD Module 3).

## Public API

- `CustomerFormDialog` — `{ customer?, open, onOpenChange }`. No `customer` → create,
  with `customer` → edit. Submits via `entities/customer` mutations.

## Owns

- `model/customer-form.schema.ts` — zod schema factory (i18n messages). Phone must be
  `+998` + 9 digits when present; name is required.

## Must never

- Talk HTTP directly or hold server lists — mutations/queries come from
  `entities/customer`.

## Pricing (ADR 0034)
The form carries the customer type (price level, labels from the `pricing` keys)
and a standing discount percent; both ride on create/update and show on the
customer row and detail. Level options come from `entities/pricing`.
