import { z } from "zod"
import type { UpdateShipmentDto } from "@/entities/shipment"

const numericString = (msg: string) =>
  z.string().refine((v) => !v || !Number.isNaN(Number(v)), { message: msg })

export const editShipmentSchema = z.object({
  shipmentDate: z.string().min(1),
  expectedCount: z
    .string()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, { message: "Min 1" }),
  overheadCost: numericString("Invalid number").optional(),
  notes: z.string().optional(),
})

export type EditShipmentValues = z.infer<typeof editShipmentSchema>

/** Omits `overheadCost` entirely when the editor cannot view costs. */
export function toUpdateShipmentDto(values: EditShipmentValues, canViewCost: boolean): UpdateShipmentDto {
  const dto: UpdateShipmentDto = {
    shipmentDate: new Date(values.shipmentDate).toISOString(),
    expectedCount: Number(values.expectedCount),
    notes: values.notes?.trim() || undefined,
  }
  if (canViewCost) {
    const oc = values.overheadCost?.trim()
    dto.overheadCost = oc ? Number(oc) : 0
  }
  return dto
}
