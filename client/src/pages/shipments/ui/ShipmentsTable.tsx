import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { useI18n } from "@/shared/i18n"
import type { ShipmentView } from "@/entities/shipment"

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
    return <div className="py-12 text-center text-muted-foreground border rounded-lg">{t("common.notFound")}</div>
  }

  return (
    <div className="rounded-lg border bg-card">
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
              <TableCell className="font-medium">{new Date(s.shipmentDate).toLocaleDateString()}</TableCell>
              <TableCell className="font-medium">{suppliersMap[s.supplierId] || s.supplierId}</TableCell>
              <TableCell>{s.expectedCount}</TableCell>
              <TableCell className="font-semibold text-primary">{s.deviceCount}</TableCell>
              <TableCell>${s.overheadCost || "0"}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => onIntake(s.id)}>
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
