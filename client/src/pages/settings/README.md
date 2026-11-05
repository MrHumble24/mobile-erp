# pages/settings

Store configuration screen at `/settings`. One `react-hook-form` + `zod` form
split into section cards, with a single Save and a dirty indicator.

## Owns

- `model/settings-schema.ts` — zod schema (ranges mirror the server
  `UpdateSettingsDto`) plus `toFormValues` / `toUpdateDto` mappers.
- Sections: Store Identity, Sales (currency fixed to USD), Discounts, Customer
  credit (the switch + default limit, ADR 0035), Shifts, Repairs (the
  `repairsEnabled` switch, ADR 0040), Bonus points (switch + earn/redeem
  percents), Printing (receipts, 58/80 mm paper width, price tags — ADR 0043),
  Nasiya defaults, Telegram & closing digest. Shows `updatedAt` as the
  last-updated stamp.

## Behaviour

- `GET /settings` is readable by any authenticated user, so cashiers see
  defaults (warranty, min margin). Without `settings.manage` all fields are
  disabled and the Save button is hidden; the server rejects writes anyway.

## Must never

- Call `useQuery`/`useMutation` or `fetch` directly — data goes through
  `@/entities/settings`.
