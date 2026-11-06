import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDateTime } from "@/shared/lib/format"
import {
  accountI18nKey,
  typeI18nKey,
  type LedgerTransaction,
  type LedgerUserRef,
} from "@/entities/ledger"
import { Badge } from "@/shared/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

function userName(user: LedgerUserRef | null): string {
  if (!user) return "—"
  if (!user.profile) return user.email
  return [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") || user.email
}

function AmountCell({ amount }: { amount: string | null }) {
  const { t } = useI18n()
  if (amount == null) {
    return (
      <TableCell className="font-mono text-sm whitespace-nowrap text-muted-foreground italic">
        {t("balance.amountHidden")}
      </TableCell>
    )
  }
  const negative = Number(amount) < 0
  return (
    <TableCell
      className={`font-mono font-bold text-sm whitespace-nowrap ${
        negative ? "text-destructive" : "text-emerald-600"
      }`}
    >
      {formatMoney(amount)}
    </TableCell>
  )
}

function HistoryRow({ tx }: { tx: LedgerTransaction }) {
  const { t } = useI18n()
  const accountKey = accountI18nKey(tx.accountCode)
  const typeKey = typeI18nKey(tx.typeCode)
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDateTime(tx.occurredAt)}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{typeKey ? t(typeKey) : tx.type.label}</Badge>
      </TableCell>
      <TableCell className="text-sm">{accountKey ? t(accountKey) : tx.account.label}</TableCell>
      <AmountCell amount={tx.amount} />
      <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
        {tx.note || "—"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{userName(tx.createdBy)}</TableCell>
    </TableRow>
  )
}

export function BalanceHistoryTable({ items }: { items: LedgerTransaction[] }) {
  const { t } = useI18n()

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-[#d4d4d4] rounded-[16px] bg-white">
        {t("balance.emptyHistory")}
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-border bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("balance.colDate")}</TableHead>
            <TableHead>{t("balance.colType")}</TableHead>
            <TableHead>{t("balance.colAccount")}</TableHead>
            <TableHead>{t("balance.colAmount")}</TableHead>
            <TableHead>{t("balance.colNote")}</TableHead>
            <TableHead>{t("balance.colUser")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((tx) => (
            <HistoryRow key={tx.id} tx={tx} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
