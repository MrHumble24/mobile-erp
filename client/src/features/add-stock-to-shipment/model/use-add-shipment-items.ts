import { useMutation, useQueryClient } from "@tanstack/react-query"
import { stockKeys } from "@/entities/stock"
import {
  shipmentItemsRepository,
  type PurchaseLineDto,
} from "../api/shipment-items.repository"

/** Buys quantity lines into a shipment (POST /shipments/:id/items). Refreshes stock levels. */
export function useAddShipmentItems(shipmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: PurchaseLineDto[]) => shipmentItemsRepository.add(shipmentId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() })
    },
  })
}
