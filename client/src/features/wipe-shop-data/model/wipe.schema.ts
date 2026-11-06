import { z } from "zod"

type T = (key: string, params?: Record<string, string | number>) => string

export function makeWipeSchema(t: T) {
  return z.object({
    shopName: z.string().min(1, t("backups.restoreShopNameRequired")),
    password: z.string().min(1, t("backups.restorePasswordRequired")),
    // Enforced true by the submit-button gate and the server's @Equals(true);
    // a plain boolean keeps the form's input and output types identical (so the
    // react-hook-form Control generics line up).
    understood: z.boolean(),
    contacts: z.boolean(),
    catalog: z.boolean(),
  })
}

export type WipeValues = z.infer<ReturnType<typeof makeWipeSchema>>
