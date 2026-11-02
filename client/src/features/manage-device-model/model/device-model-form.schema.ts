import { z } from "zod"

export const deviceModelFormSchema = z.object({
  brand: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean(),
})

export type DeviceModelFormValues = z.infer<typeof deviceModelFormSchema>
