# features/create-price-list

The one user action "save a new customs price list" (ADR 0027).

## Owns

- The new-list dialog: effective date, note, and a field-array of
  code / description / fee rows with add and remove.
- A zod schema that prefills from the current list (`initialValues`), guards a
  non-empty, duplicate-free list before POST (`validateRows`), and maps to the
  `CreatePriceListDto` (`toCreateDto`).

## Exposes

- `CreatePriceListDialog` — `{ current, open, onOpenChange }`.

## Must never

- Edit an existing version (append-only). Fetch its own data — the parent passes
  the current list for prefill; the write goes through `useCreatePriceList`.
