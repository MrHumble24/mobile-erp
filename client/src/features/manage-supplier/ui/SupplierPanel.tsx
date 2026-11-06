import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useSuppliers, type SupplierView } from "@/entities/supplier"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { SupplierDialog } from "./SupplierDialog"

type DialogState = { open: boolean; supplier: SupplierView | null }

function SupplierRow({
  supplier,
  count,
  canManage,
  onEdit,
}: {
  supplier: SupplierView
  count?: number
  canManage: boolean
  onEdit: (s: SupplierView) => void
}) {
  const { t } = useI18n()
  return (
    <TableRow>
      <TableCell className="font-medium">{supplier.name}</TableCell>
      <TableCell>{supplier.country || "-"}</TableCell>
      <TableCell>{supplier.contact || "-"}</TableCell>
      {count != null && <TableCell>{count}</TableCell>}
      <TableCell>
        <Badge variant={supplier.isActive ? "mint" : "outline"} size="sm">
          {supplier.isActive ? t("common.yes") : t("common.no")}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {canManage && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(supplier)}>
            {t("common.edit")}
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

function SupplierTable({
  suppliers,
  counts,
  canManage,
  onEdit,
}: {
  suppliers: SupplierView[]
  counts?: Record<string, number>
  canManage: boolean
  onEdit: (s: SupplierView) => void
}) {
  const { t } = useI18n()
  return (
    <div className="rounded-[16px] border border-border bg-card overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("shipments.supplierName")}</TableHead>
            <TableHead>{t("shipments.supplierCountry")}</TableHead>
            <TableHead>{t("shipments.supplierContact")}</TableHead>
            {counts && <TableHead>{t("shipments.supplierShipments")}</TableHead>}
            <TableHead>{t("shipments.supplierActive")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((s) => (
            <SupplierRow key={s.id} supplier={s} count={counts?.[s.id]} canManage={canManage} onEdit={onEdit} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function SupplierPanel({
  canManage,
  shipmentCounts,
}: {
  canManage: boolean
  shipmentCounts?: Record<string, number>
}) {
  const { t } = useI18n()
  const { data: suppliers, isLoading } = useSuppliers()
  const [dialog, setDialog] = React.useState<DialogState>({ open: false, supplier: null })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">{t("shipments.suppliers")}</h3>
        {canManage && (
          <Button size="sm" onClick={() => setDialog({ open: true, supplier: null })}>
            <Plus className="size-4" />
            {t("shipments.newSupplier")}
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
      ) : (suppliers?.length ?? 0) === 0 ? (
        <div className="py-12 text-center text-muted-foreground border border-border rounded-[16px] bg-card shadow-[var(--shadow-xs)]">{t("common.notFound")}</div>
      ) : (
        <SupplierTable
          suppliers={suppliers ?? []}
          counts={shipmentCounts}
          canManage={canManage}
          onEdit={(s) => setDialog({ open: true, supplier: s })}
        />
      )}
      <SupplierDialog
        supplier={dialog.supplier}
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
      />
    </div>
  )
}
