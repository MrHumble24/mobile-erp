import * as React from "react"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatNumber } from "@/shared/lib/format"
import { transactionDirection, type LedgerDirection, type LedgerTransaction } from "@/entities/ledger"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { HistoryRow } from "./HistoryRow"
import { TransactionDetailSheet } from "./TransactionDetailSheet"

/** Sum of one direction's rows, from signed amounts. Redacted rows are skipped. */
function sumDirection(items: LedgerTransaction[], dir: LedgerDirection): number {
  return items.reduce((sum, tx) => {
    if (tx.amount == null || transactionDirection(tx) !== dir) return sum
    return sum + Number(tx.amount)
  }, 0)
}

export function BalanceHistoryTable({
  items,
  total,
}: {
  items: LedgerTransaction[]
  total: number
}) {
  const { t } = useI18n()
  const [selectedTx, setSelectedTx] = React.useState<LedgerTransaction | null>(null)

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-[16px] bg-card">
        {t("balance.emptyHistory")}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-[16px] border border-border bg-card overflow-hidden shadow-[var(--shadow-xs)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">{t("balance.colDate")}</TableHead>
              <TableHead className="w-[140px]">{t("balance.colType")}</TableHead>
              <TableHead className="w-[90px]">{t("balance.colAccount")}</TableHead>
              <TableHead className="min-w-[200px]">{t("balance.colDetails")}</TableHead>
              <TableHead className="text-right w-[130px]">
                <span className="inline-flex items-center justify-end gap-1">
                  <ArrowDownLeft className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  {t("balance.colIn")}
                </span>
              </TableHead>
              <TableHead className="text-right w-[130px]">
                <span className="inline-flex items-center justify-end gap-1">
                  <ArrowUpRight className="size-3.5 text-destructive" aria-hidden="true" />
                  {t("balance.colOut")}
                </span>
              </TableHead>
              <TableHead className="text-right w-[140px]">
                {t("balance.colRunningBalance")}
              </TableHead>
              <TableHead className="w-[120px]">{t("balance.colUser")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((tx) => (
              <HistoryRow
                key={tx.id}
                tx={tx}
                onClick={() => setSelectedTx(tx)}
              />
            ))}
          </TableBody>
          <HistoryFooter items={items} total={total} />
        </Table>
      </div>

      <TransactionDetailSheet
        tx={selectedTx}
        open={Boolean(selectedTx)}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      />
    </>
  )
}

/** Sums the shown flow and names its exact scope: the whole filtered result when
 *  one page holds it, otherwise this page only. Redacted rows leave a footnote. */
function HistoryFooter({ items, total }: { items: LedgerTransaction[]; total: number }) {
  const { t } = useI18n()
  const isWholeSet = items.length >= total
  const hiddenCount = items.filter((tx) => tx.amount == null).length

  const inSum = Math.abs(sumDirection(items, "in"))
  const outSum = Math.abs(sumDirection(items, "out"))

  return (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={4}>
          <span className="font-semibold">{t(isWholeSet ? "balance.footerTotal" : "balance.footerPage")}</span>
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            {t("balance.entriesCount", { count: formatNumber(items.length) })}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
            +{formatMoney(inSum)}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <span className="font-mono font-bold text-sm text-destructive">
            -{formatMoney(outSum)}
          </span>
        </TableCell>
        <TableCell colSpan={2} />
      </TableRow>
      {hiddenCount > 0 && (
        <TableRow>
          <TableCell colSpan={8} className="border-0 pt-0">
            <span className="text-xs italic text-muted-foreground font-normal">
              {t("balance.footerHidden")}
            </span>
          </TableCell>
        </TableRow>
      )}
    </TableFooter>
  )
}
