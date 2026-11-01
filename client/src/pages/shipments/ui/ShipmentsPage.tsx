import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useShipments } from "@/entities/shipment"
import { useSuppliers } from "@/entities/supplier"
import { IntakeShipmentDialog } from "@/features/intake-shipment"
import { Button } from "@/shared/ui/button"
import { ShipmentsTable } from "./ShipmentsTable"

export function ShipmentsPage() {
  const { t } = useI18n()
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("shipments.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {shipmentsData ? `${shipmentsData.length} partiya` : t("common.loading")}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => handleStartIntake()}>
            + {t("shipments.newShipment")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
      ) : (
        <ShipmentsTable
          shipments={shipmentsData || []}
          suppliersMap={suppliersMap}
          onIntake={(id) => handleStartIntake(id)}
        />
      )}

      <IntakeShipmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingShipmentId={selectedShipmentId}
      />
    </div>
  )
}
