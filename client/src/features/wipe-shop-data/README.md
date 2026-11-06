# wipe-shop-data

The danger zone: erase the shop's data from the website (ADR 0057). Builds on
the same parts as restore; the shared "please wait" overlay (widgets/restore-
overlay) handles the wipe mode and, on any post-maintenance sign-in (erase or
restore), clears the cart, offline caches and sync queue so a stale mutation
cannot replay into the clean shop (the server also refuses older mutations).

## Public API (`index.ts`)

- `DangerZoneCard` — the destructive card + confirm dialog + record of past
  erases. Rendered by `pages/backups` only for a user with `data.wipe`.
- `useWipeStatus` / `WipeStatusView` — the status the overlay polls while an
  erase runs (`{wiping, needsManualRecovery, last}`).

## Shape

- `api/wipe.repository.ts` — the only caller of `/data-wipe` (via `shared/api`).
- `model/use-wipe.ts` — React Query hooks (preview, runs, status, erase). The
  erase mutation flips maintenance to `wipe` mode on its 202.
- `ui/WipeDialog.tsx` — what is erased (live counts), the two extra boxes, what
  is kept, the safety-backup/undo note, shop name + password + "I understand".
  Form values are read with `useWatch` (React Compiler is on).

## Must never

- Fetch or write outside `model/use-*` hooks and `api/`.
- Hold server rows in client state.
- Import another feature (compose in `pages/` / `widgets/`).
