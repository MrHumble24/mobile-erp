import * as React from "react"
import { useDeviceModels } from "@/entities/device-model"
import { useShipment } from "@/entities/shipment"
import { DeviceIntakeForm } from "./DeviceIntakeForm"
import { DeviceBatchList } from "./DeviceBatchList"
import { useIntakeBatch } from "../model/use-intake-batch"

export function DeviceIntakeLoop({
  shipmentId,
  canViewCost,
  canExpense,
  canUpdate,
}: {
  shipmentId: string
  canViewCost: boolean
  canExpense: boolean
  canUpdate: boolean
}) {
  const { data: modelsData } = useDeviceModels()
  const { data: shipment } = useShipment(shipmentId)
  const batch = useIntakeBatch(shipmentId)

  const modelsMap = React.useMemo(
    () =>
      (modelsData || []).reduce<Record<string, string>>((acc, m) => {
        acc[m.id] = `${m.brand} ${m.name}`
        return acc
      }, {}),
    [modelsData]
  )

  return (
    <div className="space-y-4">
      {batch.errorMsg && (
        <div className="p-3 text-sm rounded bg-destructive/15 text-destructive font-medium">{batch.errorMsg}</div>
      )}
      <DeviceIntakeForm models={modelsData || []} onAdd={batch.addItem} canExpense={canExpense} canUpdate={canUpdate} />
      <DeviceBatchList
        items={batch.batch}
        modelsMap={modelsMap}
        problemsByImei={batch.problemsByImei}
        registeredCount={shipment?.deviceCount ?? 0}
        expectedCount={shipment?.expectedCount ?? 0}
        results={batch.results}
        canViewCost={canViewCost}
        isSubmitting={batch.isSubmitting}
        onRemove={batch.removeAt}
        onSubmit={batch.submit}
      />
    </div>
  )
}
