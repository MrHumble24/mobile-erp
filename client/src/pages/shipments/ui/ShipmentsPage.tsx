import * as React from "react"
import { Plus, Upload } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useShipments, type ShipmentView } from "@/entities/shipment"
import { useSuppliers } from "@/entities/supplier"
import { IntakeShipmentDialog } from "@/features/intake-shipment"
import { ImportShipmentDialog } from "@/features/import-shipment"
import { SupplierPanel } from "@/features/manage-supplier"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"
import { ShipmentsTab } from "./ShipmentsTab"

const SHIPMENT_TABS = ["shipments", "suppliers"] as const
type ShipmentTab = (typeof SHIPMENT_TABS)[number]

function useShipmentMaps(shipments: ShipmentView[], suppliers: { id: string; name: string }[]) {
  const suppliersMap = React.useMemo(
    () => suppliers.reduce<Record<string, string>>((acc, s) => { acc[s.id] = s.name; return acc }, {}),
    [suppliers]
  )
  const shipmentCounts = React.useMemo(
    () => shipments.reduce<Record<string, number>>((acc, s) => {
      acc[s.supplierId] = (acc[s.supplierId] || 0) + 1
      return acc
    }, {}),
    [shipments]
  )
  return { suppliersMap, shipmentCounts }
}

function ShipmentsHeader({
  count,
  canManage,
  canImport,
  onNew,
  onImport,
}: {
  count?: number
  canManage: boolean
  canImport: boolean
  onNew: () => void
  onImport: () => void
}) {
  const { t } = useI18n()
  return (
    <PageHeader
      title={t("shipments.title")}
      badge={
        count != null ? (
          <Badge variant="outline" className="text-xs">{t("shipments.totalCount", { count })}</Badge>
        ) : undefined
      }
      actions={
        <div className="flex items-center gap-2">
          {canImport && (
            <Button onClick={onImport} variant="outline" size="sm" className="gap-1.5">
              <Upload className="size-4" />
              {t("shipments.importFromFile")}
            </Button>
          )}
          {canManage && (
            <Button onClick={onNew} size="sm" className="gap-1.5">
              <Plus className="size-4" />
              {t("shipments.newShipment")}
            </Button>
          )}
        </div>
      }
    />
  )
}

function useShipmentDialogs() {
  const [intakeShipmentId, setIntakeShipmentId] = React.useState<string | null>(null)
  const [intakeOpen, setIntakeOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)

  const handleNew = () => {
    setIntakeShipmentId(null)
    setIntakeOpen(true)
  }

  const handleImportSuccess = (shipmentId: string) => {
    setIntakeShipmentId(shipmentId)
    setIntakeOpen(true)
  }

  return { intakeShipmentId, intakeOpen, setIntakeOpen, importOpen, setImportOpen, handleNew, handleImportSuccess }
}

export function ShipmentsPage() {
  const { t } = useI18n()
  const [tab, setTab] = useUrlTab<ShipmentTab>("shipments", { validTabs: SHIPMENT_TABS })
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canManage = hasPermission("shipment.manage")
  const canImport = canManage && hasPermission("device.create")

  const { data: shipments, isLoading } = useShipments()
  const { data: suppliers } = useSuppliers()
  const { intakeShipmentId, intakeOpen, setIntakeOpen, importOpen, setImportOpen, handleNew, handleImportSuccess } = useShipmentDialogs()
  const { suppliersMap, shipmentCounts } = useShipmentMaps(shipments || [], suppliers || [])

  return (
    <div className="space-y-6">
      <ShipmentsHeader
        count={shipments?.length}
        canManage={canManage}
        canImport={canImport}
        onNew={handleNew}
        onImport={() => setImportOpen(true)}
      />
      <Tabs value={tab} onValueChange={(val) => setTab(val as ShipmentTab)}>
        <TabsList>
          <TabsTrigger value="shipments">{t("shipments.title")}</TabsTrigger>
          <TabsTrigger value="suppliers">{t("shipments.suppliers")}</TabsTrigger>
        </TabsList>
        <TabsContent value="shipments">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
          ) : (
            <ShipmentsTab shipments={shipments || []} suppliers={suppliers || []} suppliersMap={suppliersMap} />
          )}
        </TabsContent>
        <TabsContent value="suppliers">
          <SupplierPanel canManage={canManage} shipmentCounts={shipmentCounts} />
        </TabsContent>
      </Tabs>
      <IntakeShipmentDialog open={intakeOpen} onOpenChange={setIntakeOpen} existingShipmentId={intakeShipmentId} />
      <ImportShipmentDialog open={importOpen} onOpenChange={setImportOpen} onSuccess={handleImportSuccess} />
    </div>
  )
}
