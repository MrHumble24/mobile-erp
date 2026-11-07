import type { LucideIcon } from "lucide-react"
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDateTime } from "@/shared/lib/format"
import {
  accountI18nKey,
  typeI18nKey,
  transactionDirection,
  type LedgerDirection,
  type LedgerTransaction,
  type LedgerUserRef,
} from "@/entities/ledger"
import { Badge, type BadgeProps } from "@/shared/ui/badge"
import { TableCell, TableRow } from "@/shared/ui/table"
import { TransactionDetails } from "./TransactionDetails"

function userName(user: LedgerUserRef | null): string {
  if (!user) return "—"
  if (!user.profile) return user.email
  return [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") || user.email
}

/** Type chip tinted by flow direction: money in reads green with a down-left
 *  arrow, money out red with an up-right one, transfer with arrow-right-left. */
function DirectionBadge({ tx }: { tx: LedgerTransaction }) {
  const { t } = useI18n()
  const direction = transactionDirection(tx)
  const isTransfer = tx.typeCode === "TRANSFER"

  const variant: BadgeProps["variant"] = isTransfer
    ? "outline"
    : direction === "in"
    ? "emerald"
    : direction === "out"
    ? "destructive"
    : "outline"

  const Icon: LucideIcon | null = isTransfer
    ? ArrowRightLeft
    : direction === "in"
    ? ArrowDownLeft
    : direction === "out"
    ? ArrowUpRight
    : null

  const dirKey = direction === "in" ? "balance.dirIn" : direction === "out" ? "balance.dirOut" : null
  const typeKey = typeI18nKey(tx.typeCode)

  return (
    <Badge variant={variant} className="gap-1 whitespace-nowrap text-xs font-medium">
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {typeKey ? t(typeKey) : tx.type.label}
      {dirKey && <span className="sr-only">{t(dirKey)}</span>}
    </Badge>
  )
}

function Dash() {
  return <span className="text-sm text-muted-foreground/40 font-mono">—</span>
}

function InCell({ direction, amount }: { direction: LedgerDirection; amount: string }) {
  if (direction !== "in") {
    return (
      <TableCell className="text-right whitespace-nowrap">
        <Dash />
      </TableCell>
    )
  }
  return (
    <TableCell className="text-right whitespace-nowrap">
      <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
        +{formatMoney(Number(amount))}
      </span>
    </TableCell>
  )
}

function OutCell({
  direction,
  amount,
  hiddenLabel,
}: {
  direction: LedgerDirection
  amount: string | null
  hiddenLabel: string
}) {
  const hidden = amount == null
  const value = direction === "out" && !hidden ? formatMoney(Math.abs(Number(amount))) : null
  return (
    <TableCell className="text-right whitespace-nowrap">
      {direction !== "out" ? (
        <Dash />
      ) : value ? (
        <span className="font-mono font-bold text-sm text-destructive">
          -{value}
        </span>
      ) : (
        <span className="text-xs italic text-muted-foreground">{hiddenLabel}</span>
      )}
    </TableCell>
  )
}

function RunningBalanceCell({
  runningBalance,
}: {
  runningBalance?: string | null
}) {
  if (runningBalance == null) {
    return (
      <TableCell className="text-right whitespace-nowrap">
        <Dash />
      </TableCell>
    )
  }
  const balNum = Number(runningBalance)
  const isNegative = balNum < 0
  return (
    <TableCell className="text-right whitespace-nowrap">
      <span
        className={`font-mono font-bold text-sm ${
          isNegative ? "text-destructive" : "text-foreground"
        }`}
      >
        {formatMoney(balNum)}
      </span>
    </TableCell>
  )
}

export function HistoryRow({
  tx,
  onClick,
}: {
  tx: LedgerTransaction
  onClick: () => void
}) {
  const { t } = useI18n()
  const accountKey = accountI18nKey(tx.accountCode)
  const direction = transactionDirection(tx)

  return (
    <TableRow
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-muted/40"
    >
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
        {formatDateTime(tx.occurredAt)}
      </TableCell>
      <TableCell>
        <DirectionBadge tx={tx} />
      </TableCell>
      <TableCell className="text-xs font-medium">
        <span className="rounded bg-muted/60 px-2 py-0.5 text-muted-foreground">
          {accountKey ? t(accountKey) : tx.account.label}
        </span>
      </TableCell>
      <TableCell>
        <TransactionDetails tx={tx} />
      </TableCell>
      <InCell direction={direction} amount={tx.amount ?? ""} />
      <OutCell direction={direction} amount={tx.amount} hiddenLabel={t("balance.amountHidden")} />
      <RunningBalanceCell runningBalance={tx.accountRunningBalance} />
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {userName(tx.createdBy)}
      </TableCell>
    </TableRow>
  )
}
