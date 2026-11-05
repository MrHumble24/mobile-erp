import { useMemo } from "react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { StoreBalanceBreakdown } from "@/entities/ledger"
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

  const accountCols = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of stores) {
      for (const a of s.accounts) {
        if (!map.has(a.accountCode)) {
          map.set(a.accountCode, a.label || a.accountCode)
        }
      }
    }
    return Array.from(map.entries()).map(([code, label]) => ({ code, label }))
  }, [stores])

  return (
    <div className="rounded-[16px] border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("balance.store")}</TableHead>
            {accountCols.map((col) => (
              <TableHead key={col.code} className="text-right">
                {col.label}
              </TableHead>
            ))}
            <TableHead className="text-right">{t("balance.total")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.map((s) => (
            <TableRow key={s.storeId}>
              <TableCell className="font-medium">{s.storeName}</TableCell>
              {accountCols.map((col) => {
                const bal =
                  s.accounts.find((a) => a.accountCode === col.code)?.balance ?? 0
                return (
                  <TableCell key={col.code} className="text-right font-mono">
                    {formatMoney(bal)}
                  </TableCell>
                )
              })}
              <TableCell className="text-right font-mono font-semibold">
                {formatMoney(s.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
