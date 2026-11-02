import { z } from "zod"

export const stockAlertFormSchema = z.object({
  modelId: z.string().min(1),
  storage: z.string().min(1),
  threshold: z.number().int().min(1),
})

export type StockAlertFormValues = z.infer<typeof stockAlertFormSchema>
