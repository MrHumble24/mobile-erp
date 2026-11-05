import { z } from "zod"

const PHONE_RE = /^\+998\d{9}$/

/** Customer create/edit schema. Messages are translated by the caller. */
export function buildCustomerFormSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(1, t("customers.errNameRequired")).max(120),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || PHONE_RE.test(v.replace(/[\s-]/g, "")), {
        message: t("customers.errPhoneFormat"),
      }),
    notes: z.string().trim().max(500).optional(),
    priceLevelCode: z.string().min(1),
    standingDiscountPercent: z.string().refine(
      (v) => {
        const n = Number(v)
        return v.trim() !== "" && !Number.isNaN(n) && n >= 0 && n <= 100
      },
      { message: t("pricing.standingDiscount") }
    ),
    // Empty = use the shop's default limit; otherwise a non-negative amount.
    creditLimit: z.string().refine(
      (v) => {
        if (v.trim() === "") return true
        const n = Number(v)
        return !Number.isNaN(n) && n >= 0 && n <= 100_000_000_000
      },
      { message: t("credit.creditLimitHint") }
    ),
  })
}

export type CustomerFormValues = z.infer<ReturnType<typeof buildCustomerFormSchema>>
