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
  })
}

export type CustomerFormValues = z.infer<ReturnType<typeof buildCustomerFormSchema>>
