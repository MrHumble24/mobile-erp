import { z } from "zod"

/** Uzbek mobile number: 9 digits after the +998 country code, entered without the prefix. */
export const newCustomerSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().regex(/^\d{9}$/),
})

export type NewCustomerValues = z.infer<typeof newCustomerSchema>

/** Composes the full E.164 number the server stores as-entered. */
export function toFullPhone(nationalDigits: string): string {
  return `+998${nationalDigits}`
}
