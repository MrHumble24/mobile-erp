import { Truck } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { DeviceModelsPanel } from "@/features/manage-device-model"
import { StockAlertPanel } from "@/features/manage-stock-alert-rule"
import { PageHeader } from "@/shared/ui/page-header"
import { Badge } from "@/shared/ui/badge"
import { Link } from "@/shared/ui/link"
import { buttonVariants } from "@/shared/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"
import { DevicesTab } from "./DevicesTab"
import { useDeviceBrowser } from "../model/use-device-browser"

const INVENTORY_TABS = ["devices", "models", "alerts"] as const
type InventoryTab = (typeof INVENTORY_TABS)[number]

function InventoryHeader({ total }: { total?: number }) {
  const { t } = useI18n()
  return (
    <PageHeader
      title={t("inventory.title")}
      badge={
        total != null ? (
          <Badge variant="outline" className="text-xs">
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

export function InventoryPage() {
  const { t } = useI18n()
  const [tab, setTab] = useUrlTab<InventoryTab>("devices", { validTabs: INVENTORY_TABS })
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canManageModels = hasPermission("device.update")
  const canViewStock = hasPermission("device.read")
  const canManageStock = hasPermission("settings.manage")
  const browser = useDeviceBrowser()

  return (
    <div className="space-y-6">
      <InventoryHeader total={browser.query.data?.total} />
      <Tabs value={tab} onValueChange={(val) => setTab(val as InventoryTab)}>
        <TabsList>
          <TabsTrigger value="devices">{t("inventory.tabDevices")}</TabsTrigger>
          {canManageModels && <TabsTrigger value="models">{t("inventory.tabModels")}</TabsTrigger>}
          {canViewStock && <TabsTrigger value="alerts">{t("inventory.tabAlerts")}</TabsTrigger>}
        </TabsList>
        <TabsContent value="devices">
          <DevicesTab browser={browser} />
        </TabsContent>
        {canManageModels && (
          <TabsContent value="models">
            <DeviceModelsPanel />
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
