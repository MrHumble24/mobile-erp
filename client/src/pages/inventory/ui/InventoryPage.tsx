import { Truck } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useDeviceModels } from "@/entities/device-model"
import { useLowStock } from "@/entities/stock-alert"
import { DeviceModelsPanel } from "@/features/manage-device-model"
import { CategoryManagerPanel } from "@/features/manage-product-category"
import { StockAlertPanel } from "@/features/manage-stock-alert-rule"
import { PageHeader } from "@/shared/ui/page-header"
import { Badge } from "@/shared/ui/badge"
import { Link } from "@/shared/ui/link"
import { buttonVariants } from "@/shared/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"
import { DevicesTab } from "./DevicesTab"
import { InventoryMetricsBar } from "./InventoryMetricsBar"
import { useDeviceBrowser } from "../model/use-device-browser"

const INVENTORY_TABS = ["devices", "models", "categories", "alerts"] as const
type InventoryTab = (typeof INVENTORY_TABS)[number]

function InventoryHeader({ total }: { total?: number }) {
  const { t } = useI18n()
  return (
    <PageHeader
      title={t("inventory.title")}
      badge={
        total != null ? (
          <Badge variant="outline" className="text-xs font-mono">
            {t("inventory.totalCount", { count: total })}
          </Badge>
        ) : undefined
      }
      actions={
        <Link to="/shipments" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          <Truck className="size-4" />
          {t("nav.shipments")}
        </Link>
      }
    />
  )
}

interface InventoryTabsNavProps {
  canManageModels: boolean
  canViewStock: boolean
  devicesTotal?: number
  modelsCount?: number
  lowStockCount?: number
}

function InventoryTabsNav({
  canManageModels,
  canViewStock,
  devicesTotal,
  modelsCount,
  lowStockCount,
}: InventoryTabsNavProps) {
  const { t } = useI18n()
  return (
    <TabsList>
      <TabsTrigger value="devices" className="gap-2">
        <span>{t("inventory.tabDevices")}</span>
        {devicesTotal != null && (
          <Badge variant="outline" size="sm" className="font-mono text-[11px] h-5 px-1.5 bg-[#f0f1f5]">
            {devicesTotal}
          </Badge>
        )}
      </TabsTrigger>
      {canManageModels && (
        <TabsTrigger value="models" className="gap-2">
          <span>{t("inventory.tabModels")}</span>
          {modelsCount != null && (
            <Badge variant="outline" size="sm" className="font-mono text-[11px] h-5 px-1.5 bg-[#f0f1f5]">
              {modelsCount}
            </Badge>
          )}
        </TabsTrigger>
      )}
      {canManageModels && (
        <TabsTrigger value="categories">
          <span>{t("nav.categories")}</span>
        </TabsTrigger>
      )}
      {canViewStock && (
        <TabsTrigger value="alerts" className="gap-2">
          <span>{t("inventory.tabAlerts")}</span>
          {lowStockCount != null && lowStockCount > 0 && (
            <Badge variant="destructive" size="sm" className="text-[10px] h-4.5 px-1.5">
              {lowStockCount}
            </Badge>
          )}
        </TabsTrigger>
      )}
    </TabsList>
  )
}

export function InventoryPage() {
  const [tab, setTab] = useUrlTab<InventoryTab>("devices", { validTabs: INVENTORY_TABS })
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canManageModels = hasPermission("device.update")
  const canManagePrices = hasPermission("price.manage")
  const canViewStock = hasPermission("device.read")
  const canManageStock = hasPermission("settings.manage")
  const browser = useDeviceBrowser()
  const { data: models } = useDeviceModels()
  const { data: lowStock } = useLowStock()

  return (
    <div className="space-y-5">
      <InventoryHeader total={browser.query.data?.total} />
      <InventoryMetricsBar
        total={browser.query.data?.total}
        selectedStatus={browser.filters.statusCode}
        onSelectStatus={browser.filters.setStatusCode}
        onSelectTab={setTab}
      />
      <Tabs value={tab} onValueChange={(val) => setTab(val as InventoryTab)}>
        <InventoryTabsNav
          canManageModels={canManageModels}
          canViewStock={canViewStock}
          devicesTotal={browser.query.data?.total}
          modelsCount={models?.length}
          lowStockCount={lowStock?.length}
        />
        <TabsContent value="devices">
          <DevicesTab browser={browser} />
        </TabsContent>
        {canManageModels && (
          <TabsContent value="models">
            <DeviceModelsPanel canManagePrices={canManagePrices} />
          </TabsContent>
        )}
        {canManageModels && (
          <TabsContent value="categories">
            <CategoryManagerPanel />
          </TabsContent>
        )}
        {canViewStock && (
          <TabsContent value="alerts">
            <StockAlertPanel canManage={canManageStock} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
