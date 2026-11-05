# features/customs

The customs price-list screen (ADR 0027). A phone's customs fee is stamped at
intake from the current list and frozen; this slice manages the lists, not the
per-phone fee (that edit lives in `inventory` on the device). One route
(`customs`, perm `customs.read`); writing a new list needs `customs.manage`.

## What it owns
- `data/` — `CustomsApi` (`/customs/price-lists`), `CustomsRepository`, DTOs.
  `GET /current` returns `null` when no list exists (modelled `CurrentListDto?`).
  Cost is a decimal string; `previousFee` null = a new code.
- `lib/NewListValidation.kt` — pure `newListError` (empty list / duplicate code
  → i18n key) and `newListItems` (rows → request body). Unit-tested.
- `ui/` — `CustomsScreen` (segmented: current list · versions · unmatched),
  `CurrentListSection` (fee, previous fee, up/down/same/new marker, used-by-model),
  `CustomsSections` (versions + unmatched models), `NewListSheet` (owner-only,
  pre-filled from the current list).

## Public API
- `CustomsFeature` — the `FeatureModule`; registered in `app/FeatureRegistry`.
- `data/CustomsRepository` + DTOs — reused by the reports "Customs fees" tab for
  the code list and fee history.

## Must never
- Edit or delete a version (append-only), or recompute a stamped phone's fee.
- Open a second OkHttp client — uses `container.retrofit.create(...)`.
- Model cost fields as required: they are redaction-nullable.

## Fixes
- The screen shows its title once (app bar only; the duplicate page header was
  removed). The third tab uses the short key `customs.unmatchedShort` ("No fee").
