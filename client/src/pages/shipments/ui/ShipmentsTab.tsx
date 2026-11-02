import * as React from "react"
import { useAuthStore } from "@/features/auth"
import { type ShipmentView } from "@/entities/shipment"
import { type SupplierView } from "@/entities/supplier"
import { IntakeShipmentDialog } from "@/features/intake-shipment"
import { EditShipmentDialog } from "@/features/edit-shipment"
import { ShipmentsFilters } from "./ShipmentsFilters"
import { ShipmentsTable } from "./ShipmentsTable"
import { ShipmentDetailDrawer } from "./ShipmentDetailDrawer"
import { useShipmentBrowser } from "../model/use-shipment-browser"
import { useShipmentSelection } from "../model/use-shipment-selection"

export interface ShipmentsTabProps {
  shipments: ShipmentView[]
  suppliers: SupplierView[]
  suppliersMap: Record<string, string>
}

export function ShipmentsTab({ shipments, suppliers, suppliersMap }: ShipmentsTabProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canViewCost = hasPermission("device.cost.view")
  const canIntake = hasPermission("device.create")
  const canManage = hasPermission("shipment.manage")

  const { filters, filtered } = useShipmentBrowser(shipments, suppliersMap)
  const sel = useShipmentSelection()
  const supplierOf = React.useCallback(
    (s: ShipmentView | null) => suppliers.find((sup) => sup.id === s?.supplierId),
    [suppliers]
  )

  return (
    <div className="space-y-5">
      <ShipmentsFilters filters={filters} suppliers={suppliers} />
      <ShipmentsTable
        shipments={filtered}
        suppliersMap={suppliersMap}
        canViewCost={canViewCost}
        canIntake={canIntake}
        canManage={canManage}
        onOpen={sel.openDetail}
        onIntake={sel.openIntake}
        onEdit={sel.openEdit}
      />
      <ShipmentDetailDrawer
        shipment={sel.detail}
        supplier={supplierOf(sel.detail)}
        open={sel.detailOpen}
        onClose={() => sel.setDetailOpen(false)}
        canViewCost={canViewCost}
        canIntake={canIntake}
        canManage={canManage}
        onIntake={(id) => { sel.setDetailOpen(false); sel.openIntake(id) }}
        onEdit={(s) => { sel.setDetailOpen(false); sel.openEdit(s) }}
      />
      <EditShipmentDialog
        shipment={sel.editShipment}
        canViewCost={canViewCost}
        open={sel.editOpen}
        onOpenChange={sel.setEditOpen}
      />
      <IntakeShipmentDialog
        open={sel.intakeOpen}
        onOpenChange={sel.setIntakeOpen}
        existingShipmentId={sel.intakeShipmentId}
      />
    </div>
  )
}
