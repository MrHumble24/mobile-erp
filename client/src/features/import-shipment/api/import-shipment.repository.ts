import { http } from "@/shared/api/http"
import type { ImportShipmentDto, ImportShipmentResultView } from "../model/import-shipment.types"

export async function importShipment(dto: ImportShipmentDto): Promise<ImportShipmentResultView> {
  return http<ImportShipmentResultView>("/shipments/import", {
    method: "POST",
    body: dto,
  })
}
