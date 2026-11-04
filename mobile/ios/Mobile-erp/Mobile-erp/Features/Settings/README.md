# Settings slice

Store configuration (identity, sales defaults, Nasiya reminders, Telegram) —
the native port of the web `pages/settings`.

## Owns
- `SettingsModule.feature` — nav + route, gated `settings.manage`.
- `SettingsView` — the four web sections as Warm Card section cards (heading +
  muted description, `AppFormField` + `AppTextField`, mono for numbers and the
  chat id, the fixed-currency `FactRow`), one primary save pill, saved / error
  lines, last-updated caption. Title is `nav.settings`. DEBUG: `-open settings`.
- `SettingsModel` — load / edit draft / save; `SettingsValidation` mirrors the
  server `UpdateSettingsDto` ranges (DEBUG self-check in `SettingsValidation`).
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
