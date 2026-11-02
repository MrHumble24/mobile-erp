# Settings slice

Store configuration (identity, sales defaults, Nasiya reminders, Telegram) —
the native port of the web `pages/settings`.

## Owns
- `SettingsModule.feature` — nav + route, gated `settings.manage`.
- `SettingsView` — one `Form` with the four web sections.
- `SettingsModel` — load / edit draft / save; `SettingsValidation` mirrors the
  server `UpdateSettingsDto` ranges (DEBUG self-check in `SettingsValidation`).
- `SettingsRepository` — `GET /settings` (open) + `PUT /settings` (`settings.manage`).

## Public API
`SettingsModule.feature` — the one symbol the integrator adds to `FeatureRegistry`.

## Must never
- Write offline. Save is online-only (not an outbox type); it blocks with a
  needs-connection message when offline.
- Talk HTTP anywhere but `SettingsRepository` / its `MutationHTTP`.
- Hand-write Uzbek or edit the shared i18n.

## Notes
- `MutationHTTP` is duplicated from the Users slice (no cross-slice import) only
  because Core `APIClient` lacks PUT. Remove when the foundation adds it.
