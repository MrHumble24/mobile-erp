import { http } from "@/shared/api/http"

/** One quantity line bought into a shipment (ADR 0030). */
export interface PurchaseLineDto {
  modelId: string
  quantity: number
  unitCost: number
}

/** A purchased line as returned by the server (unitCost is a 2-dp string). */
export interface PurchasedLineView {
  modelId: string
  quantity: number
  unitCost: string
}

export const shipmentItemsRepository = {
  add: async (shipmentId: string, items: PurchaseLineDto[]): Promise<PurchasedLineView[]> => {
    return http<PurchasedLineView[]>(`/shipments/${shipmentId}/items`, {
      method: "POST",
      body: { items },
    })
  },
}
