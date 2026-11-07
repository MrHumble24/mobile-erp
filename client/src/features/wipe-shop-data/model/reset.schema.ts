import { z } from "zod"

type T = (key: string, params?: Record<string, string | number>) => string

export function makeResetSchema(t: T) {
  return z.object({
    shopName: z.string().min(1, t("backups.restoreShopNameRequired")),
    password: z.string().min(1, t("backups.restorePasswordRequired")),
    // Enforced to "erase everything" by the submit-button gate and the server;
    // a plain string keeps the form's input and output types identical so
    // react-hook-form Control generics line up cleanly.
    sentence: z.string().min(1, t("backups.resetErrConfirmSentence")),
    understood: z.boolean(),
  })
}

export type ResetValues = z.infer<ReturnType<typeof makeResetSchema>>
