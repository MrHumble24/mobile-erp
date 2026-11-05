import { z } from "zod"

export const categoryFormSchema = z.object({
  name: z.string().min(1),
  /** String from the number input; converted to an int on submit. */
  sortOrder: z.string(),
  isActive: z.boolean(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>
