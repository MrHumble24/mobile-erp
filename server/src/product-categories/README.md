# product-categories

Owns `product_categories`: user-managed groupings for the catalog (phones,
consoles, accessories …). Referenced optionally by `DeviceModel.categoryId`
(ADR 0029).

## Exposes (REST `/product-categories`)

- `GET /` — all categories, `sortOrder` then `name` (`device.read`).
- `POST /` — `{ name, sortOrder? }` (`device.update`). Duplicate `name` → 409.
- `PATCH /:id` — `{ name?, sortOrder?, isActive? }` (`device.update`). 404 if
  missing; duplicate `name` → 409.

Guarded by the **model** permissions — categories carry no permission code of
their own. `ProductCategoriesService.require(id)` is used by `device-models` to
validate `categoryId` on create/update.

## Must never

Hold catalog or unit data (that is `device-models` / `devices`), or delete a
category in use — deactivate it (`isActive:false`); `categoryId` is `SET NULL`
on delete at the DB only.
