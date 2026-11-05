import { z } from "zod"

/** Write-off (pieces + note) or count correction (counted quantity) in one form (ADR 0030). */
export const adjustStockSchema = z
  .object({
    mode: z.enum(["WRITE_OFF", "COUNT_CORRECTION"]),
    quantity: z.string(),
    countedQuantity: z.string(),
    note: z.string(),
  })
  .superRefine((v, ctx) => {
    // Messages mirror the catalog i18n copy; FormMessage renders them raw
    // (matching the device-model schema's convention).
    if (v.mode === "WRITE_OFF") {
      const q = Number(v.quantity)
      if (!v.quantity.trim() || Number.isNaN(q) || q <= 0) {
        ctx.addIssue({ code: "custom", path: ["quantity"], message: "Enter a quantity above zero" })
      }
      if (!v.note.trim()) {
        ctx.addIssue({ code: "custom", path: ["note"], message: "Reason is required" })
      }
    } else {
      const q = Number(v.countedQuantity)
      if (v.countedQuantity.trim() === "" || Number.isNaN(q) || q < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["countedQuantity"],
          message: "Enter a quantity above zero",
        })
      }
    }
  })

export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>
