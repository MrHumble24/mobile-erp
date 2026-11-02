import { z } from "zod"
import type { CreateInspectionDto, LookupView } from "@/entities/qc"

export const defectFieldSchema = z.object({
  defectCode: z.string(),
  selected: z.boolean(),
  notes: z.string(),
})

export const gradeDeviceSchema = z
  .object({
    passed: z.boolean(),
    gradeCode: z.string().optional(),
    batteryHealth: z.number().min(0).max(100),
    repairCost: z.string(),
    notes: z.string(),
    defects: z.array(defectFieldSchema),
  })
  .superRefine((values, ctx) => {
    if (!values.passed && !values.defects.some((d) => d.selected)) {
      ctx.addIssue({
        code: "custom",
        message: "fail-needs-defect",
        path: ["defects"],
      })
    }
  })

export type GradeDeviceValues = z.infer<typeof gradeDeviceSchema>

/** Field-array rows: every active defect type, unchecked, no note. */
export function defaultDefects(defectTypes: LookupView[]): GradeDeviceValues["defects"] {
  return defectTypes.map((d) => ({ defectCode: d.code, selected: false, notes: "" }))
}

export function toPayload(deviceId: string, values: GradeDeviceValues): CreateInspectionDto {
  const cost = Number(values.repairCost)
  return {
    deviceId,
    passed: values.passed,
    gradeCode: values.gradeCode || undefined,
    batteryHealth: values.batteryHealth,
    repairCostEstimate: values.repairCost.trim() && cost > 0 ? cost : undefined,
    notes: values.notes.trim() || undefined,
    defects: values.defects
      .filter((d) => d.selected)
      .map((d) => ({ defectCode: d.defectCode, notes: d.notes.trim() || undefined })),
  }
}
