import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { LedgerAccountBalance, StoreBalanceBreakdown } from "@/entities/ledger"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

export function StoreBreakdownTable({ stores }: { stores: StoreBalanceBreakdown[] }) {
  const { t } = useI18n()

  return (
    <div className="rounded-[16px] border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("balance.store")}</TableHead>
            <TableHead className="text-right">{t("balance.cash")}</TableHead>
            <TableHead className="text-right">{t("balance.bank")}</TableHead>
            <TableHead className="text-right">{t("balance.total")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.map((s) => {
            const cashBal =
              s.accounts.find((a: LedgerAccountBalance) => a.accountCode === "cash")?.balance ?? 0
            const cardBal =
              s.accounts.find((a: LedgerAccountBalance) => a.accountCode === "bank")?.balance ?? 0
            return (
              <TableRow key={s.storeId}>
                <TableCell className="font-medium">{s.storeName}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(cashBal)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(cardBal)}</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatMoney(s.total)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
