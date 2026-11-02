import { CheckCircle2, RotateCcw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import type { ConsignmentView } from "@/entities/consignment"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

function ConsignmentStatusBadge({ statusCode }: { statusCode: string }) {
  if (statusCode === "OUT") return <Badge variant="blue">Nasiyada</Badge>
  if (statusCode === "SETTLED") return <Badge variant="mint">Yopilgan</Badge>
  if (statusCode === "RETURNED") return <Badge variant="outline">Qaytarilgan</Badge>
  return <Badge variant="default">{statusCode}</Badge>
}

function ConsignmentActions({
  item,
  onSettle,
  onReturn,
}: {
  item: ConsignmentView
  onSettle: (item: ConsignmentView) => void
  onReturn: (item: ConsignmentView) => void
}) {
  const { t } = useI18n()
  if (item.statusCode !== "OUT") return null

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        className="gap-1.5 h-8 text-xs"
        onClick={() => onSettle(item)}
      >
        <CheckCircle2 className="size-3.5" />
        {t("consignments.settle")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 h-8 text-xs text-destructive hover:bg-destructive/10"
        onClick={() => onReturn(item)}
      >
        <RotateCcw className="size-3.5" />
        {t("consignments.return")}
      </Button>
    </div>
  )
}

function ConsignmentTableRow({
  item,
  onSettle,
  onReturn,
}: {
  item: ConsignmentView
  onSettle: (item: ConsignmentView) => void
  onReturn: (item: ConsignmentView) => void
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-sm font-semibold">{item.imei}</TableCell>
      <TableCell className="font-mono font-bold text-sm">
        ${Number(item.agreedPrice).toLocaleString()}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(item.dueDate).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <ConsignmentStatusBadge statusCode={item.statusCode} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(item.consignedAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <ConsignmentActions item={item} onSettle={onSettle} onReturn={onReturn} />
      </TableCell>
    </TableRow>
  )
}

export function ConsignmentsTable({
  items,
  onSettle,
  onReturn,
}: {
  items: ConsignmentView[]
  onSettle: (item: ConsignmentView) => void
  onReturn: (item: ConsignmentView) => void
}) {
  const { t } = useI18n()

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-[#d4d4d4] rounded-[16px] bg-white">
        {t("consignments.noConsignmentsFound")}
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("consignments.device")}</TableHead>
            <TableHead>{t("consignments.agreedPrice")}</TableHead>
            <TableHead>{t("consignments.dueDate")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <ConsignmentTableRow
              key={item.id}
              item={item}
              onSettle={onSettle}
              onReturn={onReturn}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
