import { z } from "zod"

export const editDeviceSchema = z.object({
  specs: z.record(z.string(), z.string()),
  targetPrice: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Invalid number" }),
})

export type EditDeviceValues = z.infer<typeof editDeviceSchema>
