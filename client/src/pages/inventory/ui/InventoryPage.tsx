import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useDevices, DeviceTable, type DeviceView } from "@/entities/device"
import { useDeviceModels } from "@/entities/device-model"
import { PageHeader } from "@/shared/ui/page-header"
import { Badge } from "@/shared/ui/badge"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { InventoryFilters } from "./InventoryFilters"
import { DeviceDetailDrawer } from "./DeviceDetailDrawer"

function InventoryHeader({ total }: { total?: number }) {
  const { t } = useI18n()
  return (
    <PageHeader
      title={t("inventory.title")}
      description="Ombordagi barcha qurilmalar ro'yxati, IMEI kodlar va texnik holatlar nazorati"
      badge={
        total != null ? (
          <Badge variant="outline" className="text-xs">
            {total} ta qurilma
          </Badge>
        ) : undefined
      }
    />
  )
}

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

function InventoryContent({
  isLoading,
  devices,
  modelsMap,
  canViewCost,
  onSelect,
}: {
  isLoading: boolean
  devices: DeviceView[]
  modelsMap: Record<string, string>
  canViewCost: boolean
  onSelect: (dev: DeviceView) => void
}) {
  const { t } = useI18n()
  if (isLoading) return <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
  return <DeviceTable devices={devices} modelsMap={modelsMap} canViewCost={canViewCost} onSelect={onSelect} />
}

export function InventoryPage() {
  const canViewCost = useAuthStore((s) => s.hasPermission("device.cost.view"))
  const [search, setSearch] = React.useState("")
  const [modelId, setModelId] = React.useState<string | undefined>()
  const [statusCode, setStatusCode] = React.useState<string | undefined>()
  const [selectedDevice, setSelectedDevice] = React.useState<DeviceView | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  const { data: modelsData } = useDeviceModels()
  const { data: devicesData, isLoading } = useDevices({ search: search || undefined, modelId, statusCode })
  const modelsMap = React.useMemo(() => {
    return (modelsData || []).reduce<Record<string, string>>((acc, m) => {
      acc[m.id] = `${m.brand} ${m.name}`
      return acc
    }, {})
  }, [modelsData])

  const openDrawer = (dev: DeviceView) => {
    setSelectedDevice(dev)
    setIsDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      <InventoryHeader total={devicesData?.total} />
      <InventoryScanner
        onScan={(imei) => {
          const found = devicesData?.items.find((d) => d.imei === imei)
          openDrawer(found || ({ imei } as DeviceView))
        }}
      />
      <InventoryFilters
        search={search}
        onSearchChange={setSearch}
        modelId={modelId}
        onModelChange={setModelId}
        statusCode={statusCode}
        onStatusChange={setStatusCode}
        models={modelsData || []}
      />
      <InventoryContent
        isLoading={isLoading}
        devices={devicesData?.items || []}
        modelsMap={modelsMap}
        canViewCost={canViewCost}
        onSelect={openDrawer}
      />
      <DeviceDetailDrawer device={selectedDevice} open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  )
}
