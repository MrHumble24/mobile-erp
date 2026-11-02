import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { ShipmentCreateForm } from "./ShipmentCreateForm"
import { DeviceIntakeLoop } from "./DeviceIntakeLoop"

export function IntakeShipmentDialog({
  open,
  onOpenChange,
  existingShipmentId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingShipmentId?: string | null
}) {
  const { t } = useI18n()
  const [createdShipmentId, setCreatedShipmentId] = React.useState<string | null>(null)
  const activeShipmentId = existingShipmentId || createdShipmentId

  const handleFinish = () => {
    onOpenChange(false)
    setCreatedShipmentId(null)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) setCreatedShipmentId(null) }}>
      <DialogPopup className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {activeShipmentId ? t("shipments.intakeDevices") : t("shipments.newShipment")}
          </DialogTitle>
          <DialogDescription>
            {activeShipmentId ? t("shipments.scanImei") : "Partiya ma'lumotlarini to'ldiring"}
          </DialogDescription>
        </DialogHeader>

        {activeShipmentId ? (
          <DeviceIntakeLoop shipmentId={activeShipmentId} onFinish={handleFinish} />
        ) : (
          <ShipmentCreateForm onSuccess={(newId) => setCreatedShipmentId(newId)} />
        )}
      </DialogPopup>
    </Dialog>
  )
}
