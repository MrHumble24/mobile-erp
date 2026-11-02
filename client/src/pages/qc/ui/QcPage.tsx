import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useDevices, type DeviceView } from "@/entities/device"
import { useDeviceModels } from "@/entities/device-model"
import { GradeDeviceDialog } from "@/features/grade-device"
import { PageHeader } from "@/shared/ui/page-header"
import { Badge } from "@/shared/ui/badge"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { QcDeviceTable } from "./QcDeviceTable"

function QcHeader({ count }: { count: number }) {
  const { t } = useI18n()
  return (
    <PageHeader
      title={t("qc.title")}
      description="Qurilmalarni texnik diagnostika qilish, nuqsonlarni aniqlash va sifat bahosini belgilash"
      badge={
        <Badge variant="outline" className="text-xs">
          {count} ta qurilma
        </Badge>
      }
    />
  )
}

function QcTabs({ activeTab, onChange }: { activeTab: string; onChange: (v: string) => void }) {
  const { t } = useI18n()
  return (
    <Tabs value={activeTab} onValueChange={onChange}>
      <TabsList>
        <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
        <TabsTrigger value="IN_STOCK">{t("inventory.statusInStock")}</TabsTrigger>
        <TabsTrigger value="DEFECTIVE">{t("inventory.statusDefective")}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export function QcPage() {
  const [activeTab, setActiveTab] = React.useState<string>("all")
  const [selectedDevice, setSelectedDevice] = React.useState<DeviceView | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const { data: modelsData } = useDeviceModels()
  const statusFilter = activeTab === "all" ? undefined : activeTab
  const { data: devicesData, isLoading } = useDevices({ statusCode: statusFilter })

  const qcDevices = React.useMemo(() => {
    return (devicesData?.items || []).filter((d) => d.statusCode === "IN_STOCK" || d.statusCode === "DEFECTIVE")
  }, [devicesData])

  const modelsMap = React.useMemo(() => {
    return (modelsData || []).reduce<Record<string, string>>((acc, m) => {
      acc[m.id] = `${m.brand} ${m.name}`
      return acc
    }, {})
  }, [modelsData])

  const openInspect = (device: DeviceView) => {
    setSelectedDevice(device)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <QcHeader count={qcDevices.length} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="w-full max-w-md">
          <BarcodeInput
            placeholder="IMEI skanerlang va tekshiring..."
            onScan={(imei) => {
              const dev = qcDevices.find((d) => d.imei === imei)
              if (dev) openInspect(dev)
            }}
          />
        </div>
        <QcTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Yuklanmoqda...</div>
      ) : (
        <QcDeviceTable devices={qcDevices} modelsMap={modelsMap} onInspect={openInspect} />
      )}

      <GradeDeviceDialog
        deviceId={selectedDevice?.id || ""}
        imei={selectedDevice?.imei || ""}
        open={dialogOpen && Boolean(selectedDevice)}
        onOpenChange={(open) => !open && setDialogOpen(false)}
      />
    </div>
  )
}
