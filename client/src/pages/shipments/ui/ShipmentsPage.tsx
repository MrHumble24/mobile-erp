import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useShipments, type ShipmentView } from "@/entities/shipment"
import { useSuppliers } from "@/entities/supplier"
import { IntakeShipmentDialog } from "@/features/intake-shipment"
import { SupplierPanel } from "@/features/manage-supplier"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs"
import { ShipmentsTab } from "./ShipmentsTab"

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

function ShipmentsHeader({ count, canManage, onNew }: { count?: number; canManage: boolean; onNew: () => void }) {
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
        canManage ? (
          <Button onClick={onNew} size="sm" className="gap-1.5">
            <Plus className="size-4" />
            {t("shipments.newShipment")}
          </Button>
        ) : undefined
      }
    />
  )
}

export function ShipmentsPage() {
  const { t } = useI18n()
  const canManage = useAuthStore((s) => s.hasPermission("shipment.manage"))
  const { data: shipments, isLoading } = useShipments()
  const { data: suppliers } = useSuppliers()
  const [newOpen, setNewOpen] = React.useState(false)
  const { suppliersMap, shipmentCounts } = useShipmentMaps(shipments || [], suppliers || [])

  return (
    <div className="space-y-6">
      <ShipmentsHeader count={shipments?.length} canManage={canManage} onNew={() => setNewOpen(true)} />
      <Tabs defaultValue="shipments">
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
      <IntakeShipmentDialog open={newOpen} onOpenChange={setNewOpen} existingShipmentId={null} />
    </div>
  )
}
