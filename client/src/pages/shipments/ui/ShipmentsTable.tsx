import { Truck } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { useI18n } from "@/shared/i18n"
import type { ShipmentView } from "@/entities/shipment"

function EmptyShipmentsState() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-[12px] border border-[#e8e8e8]">
      <div className="size-12 rounded-full bg-[#f8f9fa] border border-[#e8e8e8] flex items-center justify-center mb-3">
        <Truck className="size-6 text-[#838383]" />
      </div>
      <h3 className="text-sm font-bold font-display text-[#090c1d] mb-1">
        {t("shipments.title")} {t("common.notFound").toLowerCase()}
      </h3>
      <p className="text-xs text-[#838383] max-w-sm">
        Hozircha tizimda hech qanday tovar partiyasi mavjud emas. Yuqoridagi tugma orqali yangi partiya qabul qilishingiz mumkin.
      </p>
    </div>
  )
}

export function ShipmentsTable({
  shipments,
  suppliersMap,
  onIntake,
}: {
  shipments: ShipmentView[]
  suppliersMap: Record<string, string>
  onIntake: (id: string) => void
}) {
  const { t } = useI18n()

  if (shipments.length === 0) {
    return <EmptyShipmentsState />
  }

  return (
    <div className="rounded-[12px] border border-[#e8e8e8] bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("shipments.shipmentDate")}</TableHead>
            <TableHead>{t("shipments.supplier")}</TableHead>
            <TableHead>{t("shipments.expectedCount")}</TableHead>
            <TableHead>{t("shipments.receivedCount")}</TableHead>
            <TableHead>{t("shipments.overheadCost")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium text-xs font-mono">{new Date(s.shipmentDate).toLocaleDateString()}</TableCell>
              <TableCell className="font-medium">{suppliersMap[s.supplierId] || s.supplierId}</TableCell>
              <TableCell>{s.expectedCount}</TableCell>
              <TableCell className="font-semibold text-primary">{s.deviceCount}</TableCell>
              <TableCell>${s.overheadCost || "0"}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => onIntake(s.id)} className="h-8 rounded-full text-xs">
                  {t("shipments.intakeDevices")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
