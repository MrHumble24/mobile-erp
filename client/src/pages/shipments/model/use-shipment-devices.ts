import * as React from "react"
import { useDevices } from "@/entities/device"
import { useDeviceModels } from "@/entities/device-model"
import { useShipment } from "@/entities/shipment"

/** Loads one shipment, a page of its devices, and a model-id → name map for the drawer. */
export function useShipmentDevices(shipmentId: string) {
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSizeRaw] = React.useState(25)

  const shipment = useShipment(shipmentId)
  const devices = useDevices({ shipmentId, page, pageSize })
  const { data: modelsData } = useDeviceModels()

  const modelsMap = React.useMemo(
    () =>
      (modelsData || []).reduce<Record<string, string>>((acc, m) => {
        acc[m.id] = `${m.brand} ${m.name}`
        return acc
      }, {}),
    [modelsData]
  )

  const setPageSize = (v: number) => { setPageSizeRaw(v); setPage(1) }

  return {
    shipment: shipment.data,
    devices: devices.data,
    isLoading: devices.isLoading,
    modelsMap,
    page,
    pageSize,
    setPage,
    setPageSize,
  }
}
