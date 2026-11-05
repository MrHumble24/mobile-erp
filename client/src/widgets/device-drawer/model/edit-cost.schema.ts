import { z } from "zod"

/** Both cost edits: `amount` is the number field; `note` only shown for expense. */
export const editCostSchema = z.object({
  amount: z
    .string()
    .refine((v) => v !== "" && Number(v) >= 0 && !Number.isNaN(Number(v)), {
      message: "Invalid amount",
    }),
  note: z.string().optional(),
})

export type EditCostValues = z.infer<typeof editCostSchema>
