import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import { useDevices } from "@/entities/device"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { Skeleton } from "@/shared/ui/skeleton"
import type { BreakdownProps } from "../model/breakdown.types"

export function InventoryModelBreakdown({ request, onNavigate, canViewCost }: BreakdownProps) {
  const { t } = useI18n()
  const modelId = request.kind === "inventoryModel" ? request.modelId : undefined
  const { data, isLoading } = useDevices({
    modelId,
    statusCode: "IN_STOCK",
    pageSize: 100,
  })

  if (isLoading) return <Skeleton className="h-64 w-full rounded-[12px]" />
  const items = data?.items ?? []
  if (items.length === 0)
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("reports.empty")}
      </p>
    )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>IMEI</TableHead>
          <TableHead>{t("inventory.storage")}</TableHead>
          <TableHead>{t("reports.intakeDate")}</TableHead>
          {canViewCost && <TableHead className="text-right">{t("dashboard.avgLandedCost")}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((d) => (
          <TableRow
            key={d.id}
            className="cursor-pointer"
            onClick={() => onNavigate(`/inventory?imei=${d.imei}`)}
          >
            <TableCell className="font-mono text-xs">{d.imei}</TableCell>
            <TableCell className="text-sm">{d.specs.storage ?? "—"}</TableCell>
            <TableCell className="text-sm">{formatDate(d.intakeDate)}</TableCell>
            {canViewCost && (
              <TableCell className="font-mono text-sm text-right text-muted-foreground">
                {formatMoney(d.landedCost)}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
