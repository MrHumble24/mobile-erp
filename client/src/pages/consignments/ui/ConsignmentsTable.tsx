import { CheckCircle2, Eye, RotateCcw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
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
import { daysOverdue } from "../lib/overdue"

export interface ConsignmentRowActions {
  onOpenDetail: (item: ConsignmentView) => void
  onSettle: (item: ConsignmentView) => void
  onReturn: (item: ConsignmentView) => void
}

function ConsignmentStatusBadge({ statusCode }: { statusCode: string }) {
  const { t } = useI18n()
  if (statusCode === "OUT") return <Badge variant="blue">{t("consignments.statusOut")}</Badge>
  if (statusCode === "SETTLED") return <Badge variant="mint">{t("consignments.statusSettled")}</Badge>
  if (statusCode === "RETURNED") return <Badge variant="outline">{t("consignments.statusReturned")}</Badge>
  return <Badge variant="default">{statusCode}</Badge>
}

function DueCell({ item }: { item: ConsignmentView }) {
  const { t } = useI18n()
  const overdue = daysOverdue(item.dueDate, item.statusCode)
  return (
    <div className="text-xs">
      <div className="text-muted-foreground">{formatDate(item.dueDate)}</div>
      {overdue > 0 && (
        <span className="font-semibold text-destructive">
          {overdue} {t("consignments.daysOverdue")}
        </span>
      )}
    </div>
  )
}

function RowActions({ item, actions }: { item: ConsignmentView; actions: ConsignmentRowActions }) {
  const { t } = useI18n()
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => actions.onOpenDetail(item)}>
        <Eye className="size-3.5" />
        {t("consignments.viewDetail")}
      </Button>
      {item.statusCode === "OUT" && (
        <>
          <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => actions.onSettle(item)}>
            <CheckCircle2 className="size-3.5" />
            {t("consignments.settle")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs text-destructive hover:bg-destructive/10"
            onClick={() => actions.onReturn(item)}
          >
            <RotateCcw className="size-3.5" />
            {t("consignments.return")}
          </Button>
        </>
      )}
    </div>
  )
}

function ConsignmentTableRow({ item, actions }: { item: ConsignmentView; actions: ConsignmentRowActions }) {
  return (
    <TableRow>
      <TableCell className="font-semibold text-sm">{item.partnerShopName}</TableCell>
      <TableCell className="font-mono text-sm">{unitCode(item)}</TableCell>
      <TableCell className="font-mono font-bold text-sm">{formatMoney(item.agreedPrice)}</TableCell>
      <TableCell><DueCell item={item} /></TableCell>
      <TableCell><ConsignmentStatusBadge statusCode={item.statusCode} /></TableCell>
      <TableCell className="text-right"><RowActions item={item} actions={actions} /></TableCell>
    </TableRow>
  )
}

export function ConsignmentsTable({
  items,
  actions,
}: {
  items: ConsignmentView[]
  actions: ConsignmentRowActions
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
    <div className="rounded-[16px] border border-border bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("consignments.partner")}</TableHead>
            <TableHead>{t("consignments.device")}</TableHead>
            <TableHead>{t("consignments.agreedPrice")}</TableHead>
            <TableHead>{t("consignments.dueDate")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <ConsignmentTableRow key={item.id} item={item} actions={actions} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
