import { z } from "zod"
import type { UpdateShipmentDto } from "@/entities/shipment"

export const editShipmentSchema = z.object({
  shipmentDate: z.string().min(1),
  expectedCount: z
    .string()
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, { message: "Min 1" }),
  notes: z.string().optional(),
})

export type EditShipmentValues = z.infer<typeof editShipmentSchema>

export function toUpdateShipmentDto(values: EditShipmentValues): UpdateShipmentDto {
  return {
    shipmentDate: new Date(values.shipmentDate).toISOString(),
    expectedCount: Number(values.expectedCount),
    notes: values.notes?.trim() || undefined,
  }
}
