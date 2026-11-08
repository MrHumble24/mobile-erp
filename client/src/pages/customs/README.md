# pages/customs

Routes `/customs` and `/customs/new` (ADR 0027, ADR 0065).

- `/customs` — the current version with each code's fee, previous fee,
  up/down/same/new marker and whether a model is linked; the models still
  without a fee, **why**, and what to do next; and every past version. Reads
  need `customs.read`.
- `/customs/new` — the dedicated page for creating a new version. Needs
  `customs.manage`. The import + model-linking task is deliberately a full
  page, never a modal/sheet: dozens of rows, colors with meanings, and a save
  that also edits models need room, wayfinding (breadcrumbs), and a clear exit.

## Composes

- `entities/customs` hooks for the reads (current / versions / unmatched).
- `features/create-price-list` for the new-version form on `/customs/new`.
- `CustomsStates` for the first-run empty state, permission note and retryable
  error states (a failed query is never shown as an empty list).

## Must never

- Write the price list itself — that goes through the feature's mutation.
- Put the create flow in a dialog/sheet; the task is too complex for one.
- Show an error as "no list yet"; offer a retry with an actionable message.
