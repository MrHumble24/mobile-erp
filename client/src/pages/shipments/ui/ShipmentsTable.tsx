import { Truck, TriangleAlert } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Eye, PackagePlus, Pencil } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import type { ShipmentView } from "@/entities/shipment"
import { ShipmentProgressBadge } from "./ShipmentProgressBadge"

export interface ShipmentsTableProps {
  shipments: ShipmentView[]
  suppliersMap: Record<string, string>
  canViewCost: boolean
  canIntake: boolean
  canManage: boolean
  onOpen: (s: ShipmentView) => void
  onIntake: (id: string) => void
  onEdit: (s: ShipmentView) => void
}

function EmptyShipmentsState() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-border rounded-[16px] bg-white shadow-[var(--shadow-xs)]">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Truck className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{t("shipments.empty")}</h3>
      <p className="text-xs text-muted-foreground max-w-sm">{t("shipments.emptyHint")}</p>
    </div>
  )
}

function RowActions({
  shipment,
  canIntake,
  canManage,
  onOpen,
  onIntake,
  onEdit,
}: Pick<ShipmentsTableProps, "canIntake" | "canManage" | "onOpen" | "onIntake" | "onEdit"> & {
  shipment: ShipmentView
}) {
  const { t } = useI18n()
  return (
    <div className="flex justify-end gap-1.5">
      <Button variant="ghost" size="icon" className="size-8" onClick={() => onOpen(shipment)} aria-label={t("shipments.openDetail")} title={t("shipments.openDetail")}>
        <Eye className="size-4" />
      </Button>
      {canIntake && (
        <Button size="icon" className="size-8" onClick={() => onIntake(shipment.id)} aria-label={t("shipments.continueIntake")} title={t("shipments.continueIntake")}>
          <PackagePlus className="size-4" />
        </Button>
      )}
      {canManage && (
        <Button variant="outline" size="icon" className="size-8" onClick={() => onEdit(shipment)} aria-label={t("common.edit")} title={t("common.edit")}>
          <Pencil className="size-4" />
        </Button>
      )}
    </div>
  )
}

function ShipmentRow({ shipment, suppliersMap, canViewCost, ...actions }: ShipmentsTableProps & { shipment: ShipmentView }) {
  const { t } = useI18n()
  return (
    <TableRow>
      <TableCell className="font-medium">{suppliersMap[shipment.supplierId] || shipment.supplierId}</TableCell>
      <TableCell className="text-xs font-mono">{formatDate(shipment.shipmentDate)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <ShipmentProgressBadge received={shipment.deviceCount} expected={shipment.expectedCount} />
          {shipment.devicesWithoutCustomsFee > 0 && (
            <TriangleAlert
              className="size-3.5 text-amber-600"
              aria-label={t("shipments.devicesWithoutCustomsFee", { count: shipment.devicesWithoutCustomsFee })}
            />
          )}
        </div>
      </TableCell>
      {canViewCost && <TableCell>{formatMoney(shipment.unitExpenseTotal ?? 0)}</TableCell>}
      {canViewCost && <TableCell>{formatMoney(shipment.customsFeeTotal ?? 0)}</TableCell>}
      <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">{shipment.notes || "-"}</TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <RowActions shipment={shipment} {...actions} />
      </TableCell>
    </TableRow>
  )
}

export function ShipmentsTable(props: ShipmentsTableProps) {
  const { t } = useI18n()
  const { shipments, canViewCost } = props

  if (shipments.length === 0) return <EmptyShipmentsState />

  return (
    <div className="rounded-[16px] border border-border bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("shipments.supplier")}</TableHead>
            <TableHead>{t("shipments.shipmentDate")}</TableHead>
            <TableHead>{t("shipments.receivedCount")}</TableHead>
            {canViewCost && <TableHead>{t("shipments.unitExpenseTotal")}</TableHead>}
            {canViewCost && <TableHead>{t("shipments.customsFeeTotal")}</TableHead>}
            <TableHead>{t("common.notes")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((s) => (
            <ShipmentRow key={s.id} shipment={s} {...props} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
