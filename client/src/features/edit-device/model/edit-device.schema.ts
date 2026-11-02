import { z } from "zod"

export const editDeviceSchema = z.object({
  storage: z.string().optional(),
  color: z.string().optional(),
  ram: z.string().optional(),
  condition: z.string().optional(),
  targetPrice: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Invalid number" }),
})

export type EditDeviceValues = z.infer<typeof editDeviceSchema>
