# entities/settings

Store settings business object: types, keys, repository, query/mutation hooks.

## Public API (`index.ts`)

- Types `StoreSettings`, `UpdateSettingsDto`, `PrintSettings`.
- `settingsRepository`, `settingsKeys`.
- `useSettings()` / `useUpdateSettings()`.
- `usePrintSettings()` — `{ receiptPrintingEnabled, receiptPaperWidthMm, priceTagsEnabled }`
  (ADR 0043), defaulting to `false`, `80`, `false` while settings load. Receipt UI
  receives these as props; it never reads settings itself.

## Invariants

- `GET /settings` is the only source; components call the hooks, never `useQuery`.
- `receiptPaperWidthMm` is normalised to `58 | 80` by `usePrintSettings`.

## Never

Hold settings in Zustand. Hand-write query-key arrays. Call `fetch` here.
