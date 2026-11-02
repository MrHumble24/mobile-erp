# entity: supplier

A goods supplier (name, country, contact, notes, active flag).

## Owns
- `model/supplier.types.ts` — `SupplierView`, create/update DTOs.
- `model/supplier-form.schema.ts` — shared zod `supplierFormSchema` +
  `toCreateSupplierDto` / `toUpdateSupplierDto`. Create carries only the
  whitelisted fields (server rejects extras like `isActive`).
- `api/` — `supplierRepository` + `supplierKeys`.
- `model/use-suppliers.ts` — `useSuppliers`, `useSupplier`, `useCreateSupplier`,
  `useUpdateSupplier`.
- `ui/SupplierFormFields.tsx` — name/country/contact/notes `Form` fields shared by
  the `manage-supplier` and `intake-shipment` features.

## Public API
Everything re-exported from `index.ts`. Importers use `@/entities/supplier` only.

## Must never
- Own dialogs or feature-specific flows; those live in features. `isActive` is an
  edit-only concern rendered by the edit dialog, not by `SupplierFormFields`.
