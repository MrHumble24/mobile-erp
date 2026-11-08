# features/create-price-list

The one user action "save a new customs price list" (ADR 0027), plus linking the
imported codes to our device models so intake stamping works end to end.
Rendered on the dedicated `/customs/new` page — never inside a dialog or sheet.

## Owns

- `CreatePriceListForm` — the full-page flow: plain-language guide, effective
  date + note, a field-array of code / description / fee rows (persistent labels,
  responsive layout), a live rows/status bar with a "Link all matches" bulk
  action, and a save section that states the consequence of saving (the list
  **and** N model codes are written). Cancel returns to `/customs`.
- Excel parser (`parse-customs-file.ts`) reading `Модель` and `Цена Расстаможки`
  into rows. Errors are typed (`CustomsFileError`) so the caller shows a
  translated, actionable message instead of raw English.
- A zod schema that prefills from the current list (`initialValues`), guards a
  non-empty, duplicate-free list before POST (`validateRows`), and maps to the
  `CreatePriceListDto` (`toCreateDto`).
- Model linking (`model-match.ts`, `use-model-links.ts`): each row shows
  connection chips that **state their action in words** (already linked / link
  on save / link / replace code) rather than relying on color or hover-only
  tooltips. A searchable Combobox links anything else; every control has an
  accessible name and a visible focus ring. `use-save-price-list.ts` writes the
  pending links as `PATCH /device-models/:id` calls after the list exists and
  keeps the save button disabled until every request settles.

## Exposes

- `CreatePriceListForm` — `{ current, onSaved, onCancel }`.

## Must never

- Edit an existing version (append-only). Fetch its own data — the current list
  comes from the page; the write goes through `useCreatePriceList`, and model
  updates through `entities/device-model` only.
- Auto-link only models with **no** existing code; overwriting a code requires a
  visible user click. Server-side matching at intake stays authoritative —
  these rules only drive UX.
- Silently hide linking for users without `device.update`, or show a failed
  models query as "no models" — both cases get an explicit note.
- Put this flow in a modal/sheet. It needs a page.
