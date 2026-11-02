# features/nasiya — Partners & Consignment (Android)

The "Partners & Consignment" slice group ported from the web client. One slice
because the consign-device flow is shared by both screens and both read the
same partner mirror — so there is no cross-slice import to duplicate.

## Owns
- **Partners** (`partner.read`): directory from the LOCAL mirror (offline),
  search; ledger + aging + record-payment + create/edit (online); consign from
  a partner's ledger.
- **Consignments** (`consignment.read`): Out/Overdue/Settled/Returned/All tabs,
  search, summary tiles; detail sheet; consign / settle / return.

## Public API
- `NasiyaFeature` — the `FeatureModule` (two nav items). Integrator adds it to
  `app/FeatureRegistry.kt`. Nothing else is exported.

## Offline model (ADR 0008)
- `consignment.create|settle|return` go through `ConsignmentWriter`: REST when
  online, else the outbox; a network error mid-call also falls back to the
  outbox. A pending marker counts queued consignment mutations.
- Partner create/edit/payment are **online-only** — they block with a
  needs-connection message; never fake-queued.

## Must never
- Edit foundation/shell/registry or another slice's files.
- Put server-owned lists in client state, or call HTTP outside `data/`.
- Hand-write Uzbek — i18n comes from the web JSON via `t()`.

## Notes / limits
- `data/NasiyaApi.kt` is a slice-local Retrofit surface (the wave-0 foundation
  `ApiService` lacks these routes). It reuses the same DevConfig/token/401
  contract; promote onto `ApiService` to delete it.
- The partner mirror carries only shopName/phone/limit/outstanding, so the
  `active`/`overdue` list facets and open/overdue counts are deferred; edit
  fetches the full partner first to avoid blanking fields on PATCH.
- `MetricTile`, `CreditBar`, `PartnerPicker` are slice-local kit gaps (Select /
  date picker) — promote to `shared/ui` if reused.
