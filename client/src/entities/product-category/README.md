# product-category

User-managed `product_categories` lookup for the catalog (ADR 0029). A product
(device model) may belong to one category or none.

## Exposes (public API via `index.ts`)

- `ProductCategoryView`, `CreateProductCategoryDto`, `UpdateProductCategoryDto`.
- `productCategoryRepository` — `list` (`GET /product-categories`), `create`
  (`POST`), `update` (`PATCH /:id`, name/sortOrder/isActive).
- `productCategoryKeys` — query-key factory.
- `useProductCategories`, `useCreateProductCategory`, `useUpdateProductCategory`.

## Must never

- Own the category ⇄ product link (that is `device-model`'s `categoryId`).
- Talk HTTP outside the repository. Duplicate name → server 409.
