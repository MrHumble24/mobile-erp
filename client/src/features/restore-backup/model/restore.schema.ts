import { z } from "zod"

type T = (key: string, params?: Record<string, string | number>) => string

export function makeRestoreSchema(t: T) {
  return z.object({
    shopName: z.string().min(1, t("backups.restoreShopNameRequired")),
    password: z.string().min(1, t("backups.restorePasswordRequired")),
  })
}

export type RestoreValues = z.infer<ReturnType<typeof makeRestoreSchema>>
