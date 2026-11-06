import { z } from "zod"

type T = (key: string, params?: Record<string, string | number>) => string

export function makePassphraseSchema(t: T) {
  return z
    .object({
      passphrase: z.string().min(8, t("backups.passphraseTooShort")),
      confirm: z.string(),
    })
    .refine((v) => v.passphrase === v.confirm, {
      path: ["confirm"],
      message: t("backups.passphraseMismatch"),
    })
}

export type PassphraseValues = z.infer<ReturnType<typeof makePassphraseSchema>>
