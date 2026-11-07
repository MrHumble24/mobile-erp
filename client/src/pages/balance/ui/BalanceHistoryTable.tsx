import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Smartphone } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDateTime, formatNumber } from "@/shared/lib/format"
import {
  accountI18nKey,
  typeI18nKey,
  transactionDirection,
  type LedgerDirection,
  type LedgerTransaction,
  type LedgerUserRef,
} from "@/entities/ledger"
import { Badge, type BadgeProps } from "@/shared/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { TransactionDetailSheet } from "./TransactionDetailSheet"

function userName(user: LedgerUserRef | null): string {
  if (!user) return "—"
  if (!user.profile) return user.email
  return [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") || user.email
}

/** Sum of one direction's rows, from signed amounts. Redacted rows are skipped. */
function sumDirection(items: LedgerTransaction[], dir: LedgerDirection): number {
  return items.reduce((sum, tx) => {
    if (tx.amount == null || transactionDirection(tx) !== dir) return sum
    return sum + Number(tx.amount)
  }, 0)
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

/**
 * Rich source context renderer:
 * Displays device model name, IMEI, customer, supplier, expense category, or note.
 */
function TransactionDetails({ tx }: { tx: LedgerTransaction }) {
  const { t } = useI18n()

  // 1. Device Purchase / Device Expense / Customs with device
  if (tx.device) {
    const modelName = tx.device.model?.name || t("balance.device")
    const imei = tx.device.imei
    const supplierName = tx.shipment?.supplier?.name
    return (
      <div className="flex flex-col gap-0.5 max-w-[320px]">
        <div className="flex items-center gap-1.5 font-medium text-xs text-foreground truncate">
          <Smartphone className="size-3 text-muted-foreground shrink-0" />
          <span className="truncate">{modelName}</span>
          {imei && (
            <span className="font-mono text-[10px] text-muted-foreground/80 bg-muted/50 px-1 py-0.5 rounded shrink-0">
              {imei.slice(-6)}
            </span>
          )}
        </div>
        {supplierName ? (
          <span className="text-[11px] text-muted-foreground truncate">
            {t("balance.supplier")}: {supplierName}
          </span>
        ) : tx.note ? (
          <span className="text-[11px] text-muted-foreground truncate">{tx.note}</span>
        ) : null}
      </div>
    )
  }

  // 2. Sale
  if (tx.sale) {
    const customer = tx.sale.customer?.name
    const modelName = tx.sale.device?.model?.name || tx.sale.model?.name
    return (
      <div className="flex flex-col gap-0.5 max-w-[300px]">
        <span className="font-medium text-xs text-foreground truncate">
          {modelName ? `${modelName}` : t("balance.typeSale")}
        </span>
        {customer && (
          <span className="text-[11px] text-muted-foreground truncate">
            {t("balance.customer")}: {customer}
          </span>
        )}
      </div>
    )
  }

  // 3. Expense
  if (tx.expense) {
    const category = tx.expense.category?.name
    const desc = tx.expense.description || tx.expense.vendor
    return (
      <div className="flex flex-col gap-0.5 max-w-[300px]">
        {category && (
          <span className="font-medium text-xs text-foreground truncate">
            {category}
          </span>
        )}
        {desc && (
          <span className="text-[11px] text-muted-foreground truncate">
            {desc}
          </span>
        )}
      </div>
    )
  }

  // 4. Partner payment
  if (tx.partnerPayment?.partner) {
    return (
      <div className="flex flex-col gap-0.5 max-w-[300px]">
        <span className="font-medium text-xs text-foreground truncate">
          {tx.partnerPayment.partner.shopName}
        </span>
        {tx.note && <span className="text-[11px] text-muted-foreground truncate">{tx.note}</span>}
      </div>
    )
  }

  // 5. Customer purchase
  if (tx.customerPurchase) {
    return (
      <div className="flex flex-col gap-0.5 max-w-[300px]">
        <span className="font-medium text-xs text-foreground truncate">
          {tx.customerPurchase.device?.model?.name || t("balance.typeCustomerPurchase")}
        </span>
        {tx.customerPurchase.customer && (
          <span className="text-[11px] text-muted-foreground truncate">
            {t("balance.customer")}: {tx.customerPurchase.customer.name}
          </span>
        )}
      </div>
    )
  }

  // 6. Repair payment
  if (tx.repairPayment?.repair) {
    return (
      <div className="flex flex-col gap-0.5 max-w-[300px]">
        <span className="font-medium text-xs text-foreground truncate">
          {tx.repairPayment.repair.deviceName} (#{tx.repairPayment.repair.ticketNumber})
        </span>
        {tx.repairPayment.repair.customer && (
          <span className="text-[11px] text-muted-foreground truncate">
            {tx.repairPayment.repair.customer.name}
          </span>
        )}
      </div>
    )
  }

  // 7. Fallback to Note
  if (tx.note) {
    return (
      <span className="text-xs text-foreground/90 max-w-[300px] truncate block" title={tx.note}>
        {tx.note}
      </span>
    )
  }

  return <Dash />
}

function HistoryRow({
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
