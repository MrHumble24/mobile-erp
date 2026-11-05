# manage-product-category

Manage the product catalog's categories (ADR 0029): list, create and edit
`product_categories`. Rendered next to the products panel (the inventory
"categories" tab).

## Exposes

- `CategoryManagerPanel` — the list + the new/edit `CategoryDialog`
  (`name`, `sortOrder`, `isActive`). Guarded by `device.update` at the page.

## Must never

- Own the product ⇄ category link (that lives on `device-model.categoryId`).
- Talk HTTP directly — all writes go through `entities/product-category` hooks.
  Duplicate name surfaces the server 409 as `catalog.errorCategoryExists`.
