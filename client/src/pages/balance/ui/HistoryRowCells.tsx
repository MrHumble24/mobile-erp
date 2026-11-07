import type { LucideIcon } from "lucide-react"
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import {
  typeI18nKey,
  transactionDirection,
  type LedgerDirection,
  type LedgerTransaction,
  type LedgerUserRef,
} from "@/entities/ledger"
import { Badge, type BadgeProps } from "@/shared/ui/badge"
import { TableCell } from "@/shared/ui/table"

export function userName(user: LedgerUserRef | null): string {
  if (!user) return "—"
  if (!user.profile) return user.email
  return [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") || user.email
}

export function Dash() {
  return <span className="text-sm text-muted-foreground/40 font-mono">—</span>
}

/** Type chip tinted by flow direction: money in reads green with a down-left
 *  arrow, money out red with an up-right one, transfer with arrow-right-left.
 *  An OPENING snapshot is neither — a neutral chip, no direction arrow. */
export function DirectionBadge({ tx }: { tx: LedgerTransaction }) {
  const { t } = useI18n()
  const direction = transactionDirection(tx)
  const isTransfer = tx.typeCode === "TRANSFER"
  const isOpening = tx.typeCode === "OPENING"

  const variant: BadgeProps["variant"] = isOpening
    ? "mercury"
    : isTransfer
    ? "outline"
    : direction === "in"
    ? "emerald"
    : direction === "out"
    ? "destructive"
    : "outline"

  const Icon: LucideIcon | null = isOpening
    ? null
    : isTransfer
    ? ArrowRightLeft
    : direction === "in"
    ? ArrowDownLeft
    : direction === "out"
    ? ArrowUpRight
    : null

  const dirKey = isOpening ? null : direction === "in" ? "balance.dirIn" : direction === "out" ? "balance.dirOut" : null
  const typeKey = typeI18nKey(tx.typeCode)

  return (
    <Badge variant={variant} className="gap-1 whitespace-nowrap text-xs font-medium">
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {typeKey ? t(typeKey) : tx.type.label}
      {dirKey && <span className="sr-only">{t(dirKey)}</span>}
    </Badge>
  )
}

export function InCell({ direction, amount }: { direction: LedgerDirection; amount: string }) {
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

export function OutCell({
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

export function RunningBalanceCell({
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
