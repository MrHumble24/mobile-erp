import { z } from "zod"

export const stockLineSchema = z.object({
  modelId: z.string().min(1, "Choose a product"),
  quantity: z.string().refine((v) => Number(v) > 0, "Enter a quantity above zero"),
  unitCost: z.string().refine((v) => Number(v) >= 0, "Enter a cost"),
})

export type StockLineFormValues = z.infer<typeof stockLineSchema>

/** A line staged for purchase, ready to post. */
export interface StagedLine {
  modelId: string
  name: string
  quantity: number
  unitCost: number
}
