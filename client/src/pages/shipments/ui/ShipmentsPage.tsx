import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useShipments, type ShipmentView } from "@/entities/shipment"
import { useSuppliers } from "@/entities/supplier"
import { IntakeShipmentDialog } from "@/features/intake-shipment"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { ShipmentsTable } from "./ShipmentsTable"

function ShipmentPageHeader({
  count,
  canManage,
  onNewShipment,
}: {
  count?: number
  canManage: boolean
  onNewShipment: () => void
}) {
  const { t } = useI18n()
  return (
    <PageHeader
      title={t("shipments.title")}
      description="Yetkazib beruvchilardan kelgan tovar partiyalari va qabul qilish jurnali"
      badge={
        count != null ? (
          <Badge variant="outline" className="text-xs">
            {count} ta partiya
          </Badge>
        ) : undefined
      }
      actions={
        canManage ? (
          <Button
            onClick={onNewShipment}
            className="h-9 px-4 rounded-full text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Plus className="size-4" />
            {t("shipments.newShipment")}
          </Button>
        ) : undefined
      }
    />
  )
}

function ShipmentsContent({
  isLoading,
  shipments,
  suppliersMap,
  onIntake,
}: {
  isLoading: boolean
  shipments: ShipmentView[]
  suppliersMap: Record<string, string>
  onIntake: (id?: string) => void
}) {
  const { t } = useI18n()
  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
  }
  return <ShipmentsTable shipments={shipments} suppliersMap={suppliersMap} onIntake={onIntake} />
}

export function ShipmentsPage() {
  const canManage = useAuthStore((s) => s.hasPermission("shipment.manage"))
  const { data: shipmentsData, isLoading } = useShipments()
  const { data: suppliersData } = useSuppliers()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedShipmentId, setSelectedShipmentId] = React.useState<string | null>(null)

  const suppliersMap = React.useMemo(() => {
    return (suppliersData || []).reduce<Record<string, string>>((acc, s) => {
      acc[s.id] = s.name
      return acc
    }, {})
  }, [suppliersData])

  const handleStartIntake = (id?: string) => {
    setSelectedShipmentId(id || null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <ShipmentPageHeader
        count={shipmentsData?.length}
        canManage={canManage}
        onNewShipment={() => handleStartIntake()}
      />
      <ShipmentsContent
        isLoading={isLoading}
        shipments={shipmentsData || []}
        suppliersMap={suppliersMap}
        onIntake={(id) => handleStartIntake(id)}
      />
      <IntakeShipmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingShipmentId={selectedShipmentId}
      />
    </div>
  )
}
