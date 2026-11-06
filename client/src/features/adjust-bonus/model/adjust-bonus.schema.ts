import { z } from "zod"

/** Signed points with at most two decimals; zero is handled separately. */
const AMOUNT_RE = /^-?\d+(\.\d{1,2})?$/

export type Translate = (key: string) => string

/** Schema built with the active locale so validation messages are translated. */
export function makeAdjustBonusSchema(t: Translate) {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, t("customers.bonusErrAmountRequired"))
      .regex(AMOUNT_RE, t("customers.bonusErrAmountFormat"))
      .refine((v) => Number(v) !== 0, t("customers.bonusErrAmountZero")),
    reason: z
      .string()
      .trim()
      .min(1, t("customers.bonusErrReasonRequired"))
      .max(500, t("customers.bonusErrReasonTooLong")),
  })
}

export type AdjustBonusValues = z.infer<ReturnType<typeof makeAdjustBonusSchema>>

export interface AdjustBonusPayload {
  amount: number
  reason: string
}

export function toAdjustBonusDto(values: AdjustBonusValues): AdjustBonusPayload {
  return { amount: Number(values.amount), reason: values.reason.trim() }
}
