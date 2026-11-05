import { z } from "zod"

/** Signed points with at most two decimals; zero is handled separately. */
const AMOUNT_RE = /^-?\d+(\.\d{1,2})?$/

export const adjustBonusSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Enter an amount")
    .regex(AMOUNT_RE, "Use a number with at most 2 decimals")
    .refine((v) => Number(v) !== 0, "Amount cannot be zero"),
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(500, "Reason is too long"),
})

export type AdjustBonusValues = z.infer<typeof adjustBonusSchema>

export interface AdjustBonusPayload {
  amount: number
  reason: string
}

export function toAdjustBonusDto(values: AdjustBonusValues): AdjustBonusPayload {
  return { amount: Number(values.amount), reason: values.reason.trim() }
}
