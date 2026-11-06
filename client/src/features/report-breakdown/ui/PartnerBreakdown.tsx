import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { useConsignments, type ConsignmentView } from "@/entities/consignment"
import { usePartnerLedger, type LedgerEntry } from "@/entities/partner"
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

function ConsignmentsSection({ items }: { items: ConsignmentView[] }) {
  const { t } = useI18n()
  return (
    <section className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{t("nav.consignments")}</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("catalog.unitCode")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="text-right">{t("consignments.agreedPrice")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-sm">{formatDate(c.consignedAt)}</TableCell>
              <TableCell className="font-mono text-xs">{unitCode(c)}</TableCell>
              <TableCell className="text-sm">{c.statusCode}</TableCell>
              <TableCell className="font-mono text-sm text-right">{formatMoney(c.agreedPrice)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

function LedgerSection({ entries }: { entries: LedgerEntry[] }) {
  const { t } = useI18n()
  return (
    <section className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{t("reports.ledger")}</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("reports.ledgerKind")}</TableHead>
            <TableHead className="text-right">{t("common.amount")}</TableHead>
            <TableHead className="text-right">{t("reports.balance")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={`${e.kind}-${e.refId}-${e.at}`}>
              <TableCell className="text-sm">{formatDate(e.at)}</TableCell>
              <TableCell className="text-sm">{t(`reports.kind_${e.kind}`)}</TableCell>
              <TableCell className="font-mono text-sm text-right">{formatMoney(e.change)}</TableCell>
              <TableCell className="font-mono text-sm text-right font-semibold">{formatMoney(e.runningBalance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

export function PartnerBreakdown({ request }: BreakdownProps) {
  const partnerId = request.kind === "partner" ? request.partnerId : undefined
  const { data: consignments, isLoading } = useConsignments({ partnerId, pageSize: 100 })
  const { data: ledger } = usePartnerLedger(partnerId)

  if (isLoading) return <Skeleton className="h-64 w-full rounded-[12px]" />
  return (
    <div className="space-y-6">
      <ConsignmentsSection items={consignments?.items ?? []} />
      <LedgerSection entries={ledger ?? []} />
    </div>
  )
}
