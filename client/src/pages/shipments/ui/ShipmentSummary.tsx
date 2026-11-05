import { TriangleAlert } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDateTime, formatDate } from "@/shared/lib/format"
import type { ShipmentView } from "@/entities/shipment"
import type { SupplierView } from "@/entities/supplier"
import { accountLabel } from "@/entities/ledger"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}:</span>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function SupplierLine({ supplier }: { supplier?: SupplierView }) {
  const { t } = useI18n()
  const parts = [supplier?.country, supplier?.contact].filter(Boolean).join(" · ")
  return (
    <Row
      label={t("shipments.supplier")}
      value={supplier ? `${supplier.name}${parts ? ` (${parts})` : ""}` : "-"}
    />
  )
}

function CostRows({
  shipment,
  avgLanded,
}: {
  shipment: ShipmentView
  avgLanded: number | null
}) {
  const { t } = useI18n()
  return (
    <>
      <Row label={t("shipments.unitExpenseTotal")} value={formatMoney(shipment.unitExpenseTotal ?? 0)} />
      <Row label={t("shipments.customsFeeTotal")} value={formatMoney(shipment.customsFeeTotal ?? 0)} />
      <Row label={t("shipments.avgLandedPerUnit")} value={avgLanded == null ? "-" : formatMoney(avgLanded)} />
    </>
  )
}

export function ShipmentSummary({
  shipment,
  supplier,
  canViewCost,
  avgLanded,
}: {
  shipment: ShipmentView
  supplier?: SupplierView
  canViewCost: boolean
  avgLanded: number | null
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm border border-[#e8e8e8] rounded-[16px] p-4 bg-[#f8f9fa] shadow-[var(--shadow-xs)]">
      <SupplierLine supplier={supplier} />
      <Row label={t("shipments.shipmentDate")} value={formatDate(shipment.shipmentDate)} />
      <Row label={t("shipments.expectedCount")} value={String(shipment.expectedCount)} />
      <Row label={t("shipments.receivedCount")} value={String(shipment.deviceCount)} />
      <Row label={t("balance.payFrom")} value={accountLabel(shipment.paymentAccountCode, undefined, t)} />
      {canViewCost && <CostRows shipment={shipment} avgLanded={avgLanded} />}
      <Row label={t("shipments.createdAt")} value={formatDateTime(shipment.createdAt)} />
      {shipment.devicesWithoutCustomsFee > 0 && (
        <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-medium text-amber-600">
          <TriangleAlert className="size-3.5 shrink-0" />
          {t("shipments.devicesWithoutCustomsFee", { count: shipment.devicesWithoutCustomsFee })}
        </p>
      )}
      <div className="sm:col-span-2">
        <Row label={t("common.notes")} value={shipment.notes || "-"} />
      </div>
    </div>
  )
}
