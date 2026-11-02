import { z } from "zod"

/** Shared schema for supplier create/edit forms. `isActive` is edit-only. */
export const supplierFormSchema = z.object({
  name: z.string().min(1),
  country: z.string().optional(),
  contact: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type SupplierFormValues = z.infer<typeof supplierFormSchema>

function trimOrUndefined(value?: string): string | undefined {
  const v = value?.trim()
  return v ? v : undefined
}

/** Create payload carries only the whitelisted create fields (server rejects extras). */
export function toCreateSupplierDto(values: SupplierFormValues) {
  return {
    name: values.name.trim(),
    country: trimOrUndefined(values.country),
    contact: trimOrUndefined(values.contact),
    notes: trimOrUndefined(values.notes),
  }
}

export function toUpdateSupplierDto(values: SupplierFormValues) {
  return {
    name: values.name.trim(),
    country: trimOrUndefined(values.country),
    contact: trimOrUndefined(values.contact),
    notes: trimOrUndefined(values.notes),
    isActive: values.isActive,
  }
}
