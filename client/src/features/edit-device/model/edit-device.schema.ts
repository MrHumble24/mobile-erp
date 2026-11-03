import { z } from "zod"
import { IMEI_REGEX } from "@/entities/device"

type T = (key: string) => string

/** Built per-device so imei2 can be checked against the device's primary IMEI. */
export function buildEditDeviceSchema(primaryImei: string, t: T) {
  return z
    .object({
      specs: z.record(z.string(), z.string()),
      targetPrice: z
        .string()
        .optional()
        .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Invalid number" }),
      dualSim: z.boolean(),
      imei2: z
        .string()
        .optional()
        .refine((v) => !v || IMEI_REGEX.test(v.trim()), { message: t("shipments.imeiLength") })
        .refine((v) => !v || v.trim() !== primaryImei, { message: t("inventory.imei2Mismatch") }),
    })
    .refine((d) => !d.dualSim || !!d.imei2?.trim(), {
      message: t("inventory.imei2Required"),
      path: ["imei2"],
    })
}

export type EditDeviceValues = z.infer<ReturnType<typeof buildEditDeviceSchema>>
