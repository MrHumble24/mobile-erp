import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDateTime, formatDate } from "@/shared/lib/format"
import type { ShipmentView } from "@/entities/shipment"
import type { SupplierView } from "@/entities/supplier"

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
  const perUnit = shipment.deviceCount > 0 ? Number(shipment.overheadCost || 0) / shipment.deviceCount : null
  return (
    <>
      <Row label={t("shipments.overheadCost")} value={formatMoney(shipment.overheadCost)} />
      <Row label={t("shipments.overheadPerUnit")} value={perUnit == null ? "-" : formatMoney(perUnit)} />
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
      {canViewCost && <CostRows shipment={shipment} avgLanded={avgLanded} />}
      <Row label={t("shipments.createdAt")} value={formatDateTime(shipment.createdAt)} />
      <div className="sm:col-span-2">
        <Row label={t("common.notes")} value={shipment.notes || "-"} />
      </div>
    </div>
  )
}
