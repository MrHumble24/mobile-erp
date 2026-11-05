import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import type { CreditListItem } from "@/entities/credit"

function StatusBadge({ credit }: { credit: CreditListItem }) {
  const { t } = useI18n()
  if (credit.settled) return <Badge variant="outline">{t("credit.settled")}</Badge>
  if (Number(credit.overdueAmount) > 0) return <Badge variant="destructive">{t("credit.overdue")}</Badge>
  return <Badge variant="violet">{t("credit.open")}</Badge>
}

export function CreditsTable({
  credits,
  onOpen,
}: {
  credits: CreditListItem[]
  onOpen: (id: string) => void
}) {
  const { t } = useI18n()

  if (credits.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-[#d4d4d4] bg-white p-8 text-center text-sm text-muted-foreground">
        {t("credit.noCredits")}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#e8e8e8] bg-white shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("pos.customer")}</TableHead>
            <TableHead>{t("credit.agreedTotal")}</TableHead>
            <TableHead>{t("credit.paid")}</TableHead>
            <TableHead>{t("credit.outstanding")}</TableHead>
            <TableHead>{t("credit.overdueAmount")}</TableHead>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {credits.map((credit) => (
            <TableRow
              key={credit.id}
              className="cursor-pointer"
              onClick={() => onOpen(credit.id)}
            >
              <TableCell>
                <div className="font-semibold">{credit.customer.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{credit.customer.phone || "—"}</div>
              </TableCell>
              <TableCell className="font-mono">{formatMoney(credit.agreedTotal)}</TableCell>
              <TableCell className="font-mono">{formatMoney(credit.paid)}</TableCell>
              <TableCell className="font-mono font-semibold">{formatMoney(credit.outstanding)}</TableCell>
              <TableCell className="font-mono">
                {Number(credit.overdueAmount) > 0 ? (
                  <span className="text-destructive">{formatMoney(credit.overdueAmount)}</span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(credit.createdAt)}</TableCell>
              <TableCell>
                <StatusBadge credit={credit} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
