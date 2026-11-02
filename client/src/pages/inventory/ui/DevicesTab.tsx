import * as React from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useCartStore } from "@/features/checkout"
import { useDeviceModels } from "@/entities/device-model"
import { type DeviceView } from "@/entities/device"
import { EditDeviceDialog } from "@/features/edit-device"
import { DeviceDrawer } from "@/widgets/device-drawer"
import { toast } from "@/shared/ui/sonner"
import { InventoryFilters } from "./InventoryFilters"
import { DeviceListSection } from "./DeviceListSection"
import type { useDeviceBrowser } from "../model/use-device-browser"
import { useDeviceSelection } from "../model/use-device-selection"

type Browser = ReturnType<typeof useDeviceBrowser>

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

function useImeiDeepLink(onOpen: (imei: string) => void) {
  const [params] = useSearchParams()
  const imei = params.get("imei")
  React.useEffect(() => {
    if (imei) onOpen(imei)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imei])
}

function useInventoryActions(browser: Browser) {
  const { t } = useI18n()
  const navigate = useNavigate()

  const handleSell = (d: DeviceView) => {
    useCartStore.getState().setDevice(d as any)
    navigate("/pos")
    toast.success(t("inventory.deviceAddedToCart"))
  }

  const handleResetFilters = () => {
    browser.filters.setSearchInput("")
    browser.filters.setModelId(undefined)
    browser.filters.setStatusCode(undefined)
    browser.filters.setStorage(undefined)
  }

  return { handleSell, handleResetFilters }
}

export function DevicesTab({ browser }: { browser: Browser }) {
  const canViewCost = useAuthStore((s) => s.hasPermission("device.cost.view"))
  const canEdit = useAuthStore((s) => s.hasPermission("device.update"))
  const sel = useDeviceSelection()
  const { models, map } = useModelsMap()
  const { handleSell, handleResetFilters } = useInventoryActions(browser)
  useImeiDeepLink((imei) => sel.openDrawer({ imei }))

  return (
    <div className="space-y-4">
      <InventoryFilters filters={browser.filters} models={models} onScan={(imei) => sel.openDrawer({ imei })} />
      <DeviceListSection
        data={browser.query.data}
        isLoading={browser.query.isLoading}
        modelsMap={map}
        canViewCost={canViewCost}
        canEdit={canEdit}
        page={browser.pagination.page}
        pageSize={browser.pagination.pageSize}
        onPageChange={browser.pagination.setPage}
        onPageSizeChange={browser.pagination.setPageSize}
        onSelect={(d) => sel.openDrawer({ imei: d.imei, id: d.id })}
        onEdit={sel.openEdit}
        onSell={handleSell}
        onResetFilters={handleResetFilters}
      />
      <DeviceDrawer
        imei={sel.target?.imei ?? null}
        open={sel.drawerOpen}
        onClose={() => sel.setDrawerOpen(false)}
        onEdit={(d) => { sel.setDrawerOpen(false); sel.openEdit(d) }}
        onSell={(d) => { sel.setDrawerOpen(false); handleSell(d) }}
      />
      <EditDeviceDialog device={sel.editDevice} open={sel.editOpen} onOpenChange={sel.setEditOpen} />
    </div>
  )
}
