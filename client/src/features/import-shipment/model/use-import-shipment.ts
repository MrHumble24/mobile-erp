import { useMutation, useQueryClient } from "@tanstack/react-query"
import { shipmentKeys } from "@/entities/shipment"
import { deviceKeys } from "@/entities/device"
import type { HttpError } from "@/shared/api/http"
import { importShipment } from "../api/import-shipment.repository"
import type { ImportShipmentDto, ImportShipmentResultView } from "./import-shipment.types"

export function useImportShipment() {
  const queryClient = useQueryClient()
  return useMutation<ImportShipmentResultView, HttpError, ImportShipmentDto>({
    mutationFn: (dto) => importShipment(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shipmentKeys.all })
      void queryClient.invalidateQueries({ queryKey: deviceKeys.all })
    },
  })
}
