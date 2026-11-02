import { useI18n } from "@/shared/i18n"
import type { ShipmentView } from "@/entities/shipment"
import type { SupplierView } from "@/entities/supplier"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/shared/ui/sheet"
import { Button } from "@/shared/ui/button"
import { ShipmentSummary } from "./ShipmentSummary"
import { ShipmentDevicesSection } from "./ShipmentDevicesSection"
import { useShipmentDevices } from "../model/use-shipment-devices"

export interface ShipmentDetailDrawerProps {
  shipment: ShipmentView | null
  supplier?: SupplierView
  open: boolean
  onClose: () => void
  canViewCost: boolean
  canIntake: boolean
  canManage: boolean
  onIntake: (id: string) => void
  onEdit: (s: ShipmentView) => void
}

/** ponytail: avg landed is over the loaded devices page only; exact when total ≤ page size. */
function avgLandedOf(items: { landedCost?: string }[]): number | null {
  if (items.length === 0) return null
  const sum = items.reduce((acc, d) => acc + Number(d.landedCost || 0), 0)
  return sum / items.length
}

function DrawerBody({ shipment, supplier, canViewCost }: Pick<ShipmentDetailDrawerProps, "shipment" | "supplier" | "canViewCost"> & { shipment: ShipmentView }) {
  const data = useShipmentDevices(shipment.id)
  const fresh = data.shipment ?? shipment
  return (
    <div className="space-y-5 my-4 overflow-y-auto">
      <ShipmentSummary
        shipment={fresh}
        supplier={supplier}
        canViewCost={canViewCost}
        avgLanded={canViewCost ? avgLandedOf(data.devices?.items ?? []) : null}
      />
      <ShipmentDevicesSection
        data={data.devices}
        isLoading={data.isLoading}
        modelsMap={data.modelsMap}
        canViewCost={canViewCost}
        page={data.page}
        pageSize={data.pageSize}
        onPageChange={data.setPage}
        onPageSizeChange={data.setPageSize}
      />
    </div>
  )
}

function DrawerActions({
  shipment,
  canIntake,
  canManage,
  onIntake,
  onEdit,
}: Pick<ShipmentDetailDrawerProps, "canIntake" | "canManage" | "onIntake" | "onEdit"> & { shipment: ShipmentView }) {
  const { t } = useI18n()
  if (!canIntake && !canManage) return null
  return (
    <SheetFooter>
      {canManage && <Button variant="outline" onClick={() => onEdit(shipment)}>{t("shipments.editShipment")}</Button>}
      {canIntake && <Button onClick={() => onIntake(shipment.id)}>{t("shipments.continueIntake")}</Button>}
    </SheetFooter>
  )
}

export function ShipmentDetailDrawer(props: ShipmentDetailDrawerProps) {
  const { t } = useI18n()
  const { shipment, supplier, open, onClose, canViewCost, canIntake, canManage, onIntake, onEdit } = props
  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetPopup className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("shipments.detailTitle")}</SheetTitle>
          <SheetDescription>{supplier?.name}</SheetDescription>
        </SheetHeader>
        {shipment && (
          <>
            <DrawerBody shipment={shipment} supplier={supplier} canViewCost={canViewCost} />
            <DrawerActions
              shipment={shipment}
              canIntake={canIntake}
              canManage={canManage}
              onIntake={onIntake}
              onEdit={onEdit}
            />
          </>
        )}
      </SheetPopup>
    </Sheet>
  )
}
