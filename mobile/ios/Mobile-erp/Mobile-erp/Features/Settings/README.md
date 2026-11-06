# Settings slice

Store configuration (identity, sales defaults, Nasiya reminders, Telegram,
discounts, credit, shifts, repairs, bonus points, and printing preferences) —
the native port of the web `pages/settings`.

## Owns
- `SettingsModule.feature` — nav + route, gated `settings.manage`.
- `SettingsView` — Warm Card section cards (identity, sales, Nasiya, Telegram,
  discounts, credit, shifts, repairs, bonus points, printing), save pill,
  saved / error lines, last-updated caption. Title is `nav.settings`.
- `SettingsModel` — load / edit draft / save; `SettingsValidation` mirrors
  `UpdateSettingsDto` ranges (including bonus rates when enabled).
- `SettingsRepository` — `GET /settings` (open) + `PUT /settings` (`settings.manage`).

## Public API
`SettingsModule.feature` — the one symbol the integrator adds to `FeatureRegistry`.

## Must never
- Write offline. Save is online-only (not an outbox type); it blocks with a
  needs-connection message when offline.
- Talk HTTP anywhere but `SettingsRepository`.
- Hand-write Uzbek or edit the shared i18n.

## Notes
- `PUT /settings` goes through `container.api.putJSONVoid` (the shared `APIClient`
  now ships PUT/PATCH/DELETE + `*JSON` bodies) — no slice-local client.
