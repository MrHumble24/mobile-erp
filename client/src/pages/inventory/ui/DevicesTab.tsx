import * as React from "react"
import { useSearchParams } from "react-router"
import { useAuthStore } from "@/features/auth"
import { useDeviceModels } from "@/entities/device-model"
import { EditDeviceDialog } from "@/features/edit-device"
import { DeviceDrawer } from "@/widgets/device-drawer"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { InventoryFilters } from "./InventoryFilters"
import { DeviceListSection } from "./DeviceListSection"
import type { useDeviceBrowser } from "../model/use-device-browser"
import { useDeviceSelection } from "../model/use-device-selection"

type Browser = ReturnType<typeof useDeviceBrowser>

function InventoryScanner({ onScan }: { onScan: (imei: string) => void }) {
  const [val, setVal] = React.useState("")
  return (
    <div className="w-full max-w-xl">
      <BarcodeInput
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onScan={onScan}
        onClear={() => setVal("")}
        placeholder="IMEI skanerlang (15 xona)..."
      />
    </div>
  )
}

function useModelsMap() {
  const { data } = useDeviceModels()
  const map = React.useMemo(
    () => (data || []).reduce<Record<string, string>>((acc, m) => {
      acc[m.id] = `${m.brand} ${m.name}`
      return acc
    }, {}),
    [data]
  )
  return { models: data || [], map }
}

export function DevicesTab({ browser }: { browser: Browser }) {
  const canViewCost = useAuthStore((s) => s.hasPermission("device.cost.view"))
  const canEdit = useAuthStore((s) => s.hasPermission("device.update"))
  const { filters, pagination, query } = browser
  const sel = useDeviceSelection()
  const { models, map } = useModelsMap()
  const [searchParams] = useSearchParams()
  const imeiParam = searchParams.get("imei")

  // Deep link from the shipment drawer: /inventory?imei=<imei> opens that device.
  React.useEffect(() => {
    if (imeiParam) sel.openDrawer({ imei: imeiParam })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imeiParam])

  return (
    <div className="space-y-5">
      <InventoryScanner onScan={(imei) => sel.openDrawer({ imei })} />
      <InventoryFilters filters={filters} models={models} />
      <DeviceListSection
        data={query.data}
        isLoading={query.isLoading}
        modelsMap={map}
        canViewCost={canViewCost}
        canEdit={canEdit}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
        onSelect={(d) => sel.openDrawer({ imei: d.imei, id: d.id })}
        onEdit={sel.openEdit}
      />
      <DeviceDrawer
        imei={sel.target?.imei ?? null}
        open={sel.drawerOpen}
        onClose={() => sel.setDrawerOpen(false)}
        onEdit={(d) => { sel.setDrawerOpen(false); sel.openEdit(d) }}
      />
      <EditDeviceDialog device={sel.editDevice} open={sel.editOpen} onOpenChange={sel.setEditOpen} />
    </div>
  )
}
