# entities/customs

Customs price-list versions and the per-model customs code (ADR 0027). A phone's
fee is stamped by the server at intake; this slice only reads the lists and
creates new versions.

## Owns

- Types for the current list, versions, unmatched models and a code's fee
  history; `feeChangeOf` derives the up/down/same/new marker from an item's
  `previousFee`.
- `customsRepository` over `/customs/price-lists`; React Query hooks and key
  factory.

## Exposes (public API via `index.ts`)

- `useCurrentPriceList` — `null` when no list exists yet.
- `usePriceListVersions`, `useUnmatchedModels`, `useFeeHistory(code)`.
- `useCreatePriceList` — POST a new version; invalidates all customs queries.

## Must never

- Edit or delete a version (append-only on the server).
- Hold price-list data in Zustand or fetch outside the hooks.
