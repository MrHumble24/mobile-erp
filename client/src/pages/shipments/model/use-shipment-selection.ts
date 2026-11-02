import * as React from "react"
import type { ShipmentView } from "@/entities/shipment"

/** UI state for the detail drawer, edit dialog and intake dialog on the shipments tab. */
export function useShipmentSelection() {
  const [detail, setDetail] = React.useState<ShipmentView | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [editShipment, setEditShipment] = React.useState<ShipmentView | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [intakeShipmentId, setIntakeShipmentId] = React.useState<string | null>(null)
  const [intakeOpen, setIntakeOpen] = React.useState(false)

  const openDetail = (s: ShipmentView) => { setDetail(s); setDetailOpen(true) }
  const openEdit = (s: ShipmentView) => { setEditShipment(s); setEditOpen(true) }
  const openIntake = (id?: string) => { setIntakeShipmentId(id ?? null); setIntakeOpen(true) }

  return {
    detail,
    detailOpen,
    setDetailOpen,
    openDetail,
    editShipment,
    editOpen,
    setEditOpen,
    openEdit,
    intakeShipmentId,
    intakeOpen,
    setIntakeOpen,
    openIntake,
  }
}
