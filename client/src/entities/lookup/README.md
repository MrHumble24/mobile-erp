# lookup

Device-code lookup for intake (ADR 0031, Change 5). Resolves a scanned/typed
Apple box code or 15-digit IMEI against the free reference lists and, when it
can, names our catalog product so the intake form preselects model/storage/
colour.

## Exposes

- `useLookup(code | null)` — enabled for codes ≥ 5 chars; cached for the session
  (the lists are static); a 404 resolves to `null` (the lists do not know it).
- `useTeachLink()` — mutation for `POST /lookup/links` (`device.update`).
- `lookupRepository`, `lookupKeys`.
- `LookupResult`, `LookupReference`, `LookupProduct`, `LookupSource`, `TeachLinkDto`.

## Must never

- Block or slow down saving a device — it is a side lookup, not a gate.
- Overwrite fields the person already typed (the consuming feature fills only
  empty storage/colour).
