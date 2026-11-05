import { z } from "zod"
import type { CreatePriceListDto, CurrentPriceList } from "@/entities/customs"
import { todayIso } from "../../../shared/lib/local-date.ts"

const rowSchema = z.object({
  customsCode: z.string().min(1),
  description: z.string().optional(),
  fee: z
    .string()
    .refine((v) => v !== "" && Number(v) >= 0 && !Number.isNaN(Number(v)), {
      message: "Invalid fee",
    }),
})

export const createPriceListSchema = z.object({
  effectiveAt: z.string().min(1),
  note: z.string().optional(),
  items: z.array(rowSchema),
})

export type CreatePriceListValues = z.infer<typeof createPriceListSchema>
export type PriceListRow = z.infer<typeof rowSchema>

const EMPTY_ROW: PriceListRow = { customsCode: "", description: "", fee: "" }

/** Prefill the form from the current list so the owner edits only what changed. */
export function initialValues(current: CurrentPriceList | null): CreatePriceListValues {
  return {
    effectiveAt: todayIso(),
    note: "",
    items: current
      ? current.items.map((i) => ({
          customsCode: i.customsCode,
          description: i.description ?? "",
          fee: i.fee,
        }))
      : [EMPTY_ROW],
  }
}

export const emptyRow = (): PriceListRow => ({ ...EMPTY_ROW })

export type RowError = "empty" | "duplicate" | null

/** Local guard before POST: at least one row, no duplicate code. */
export function validateRows(items: PriceListRow[]): RowError {
  if (items.length === 0) return "empty"
  const codes = items.map((i) => i.customsCode.trim().toUpperCase()).filter(Boolean)
  if (codes.length === 0) return "empty"
  if (new Set(codes).size !== codes.length) return "duplicate"
  return null
}

export function toCreateDto(values: CreatePriceListValues): CreatePriceListDto {
  return {
    effectiveAt: new Date(values.effectiveAt).toISOString(),
    note: values.note?.trim() || undefined,
    items: values.items.map((i) => ({
      customsCode: i.customsCode.trim(),
      description: i.description?.trim() || undefined,
      fee: Number(i.fee),
    })),
  }
}
