import { ArrowDownLeft, ArrowUpRight, Copy } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDateTime } from "@/shared/lib/format"
import {
  accountI18nKey,
  typeI18nKey,
  transactionDirection,
  type LedgerTransaction,
} from "@/entities/ledger"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/shared/ui/sheet"
import { toast } from "sonner"

interface Props {
  tx: LedgerTransaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDetailSheet({ tx, open, onOpenChange }: Props) {
  const { t } = useI18n()

  if (!tx) return null

  const direction = transactionDirection(tx)
  const isPositive = direction === "in"
  const accountKey = accountI18nKey(tx.accountCode)
  const typeKey = typeI18nKey(tx.typeCode)

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} nusxalandi`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup className="sm:max-w-md">
        <SheetHeader className="space-y-1 text-left pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                direction === "in"
                  ? "emerald"
                  : direction === "out"
                  ? "destructive"
                  : "outline"
              }
              className="gap-1 text-xs"
            >
              {direction === "in" ? (
                <ArrowDownLeft className="size-3.5" />
              ) : (
                <ArrowUpRight className="size-3.5" />
              )}
              {typeKey ? t(typeKey) : tx.type.label}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {accountKey ? t(accountKey) : tx.account.label}
            </span>
          </div>
          <SheetTitle className="text-xl font-bold tracking-tight">
            {t("balance.detailsTitle")}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {formatDateTime(tx.occurredAt)}
          </SheetDescription>
        </SheetHeader>

        {/* Amounts summary card */}
        <div className="mt-6 rounded-[14px] border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              {direction === "in" ? t("balance.colIn") : t("balance.colOut")}
            </span>
            <span
              className={`font-mono text-xl font-bold ${
                isPositive
                  ? "text-emerald-500"
                  : "text-destructive"
              }`}
            >
              {tx.amount != null
                ? `${isPositive ? "+" : "-"}${formatMoney(Math.abs(Number(tx.amount)))}`
                : t("balance.amountHidden")}
            </span>
          </div>

          {tx.accountRunningBalance != null && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
              <span className="text-muted-foreground">
                {t("balance.colRunningBalance")} ({accountKey ? t(accountKey) : tx.account.label})
              </span>
              <span className="font-mono font-bold text-foreground">
                {formatMoney(Number(tx.accountRunningBalance))}
              </span>
            </div>
          )}
        </div>

        {/* Detailed context info */}
        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("balance.colDetails")}
          </h4>

          {/* Device information */}
          {tx.device && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-xs">
              <span className="font-semibold text-foreground flex items-center justify-between">
                <span>{t("balance.device")}</span>
                {tx.device.model?.name && (
                  <Badge variant="outline" className="text-[10px]">
                    {tx.device.model.name}
                  </Badge>
                )}
              </span>
              {tx.device.imei && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">IMEI:</span>
                  <div className="flex items-center gap-1 font-mono">
                    <span>{tx.device.imei}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5"
                      onClick={() => copyText("IMEI", tx.device?.imei ?? "")}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shipment / Supplier information */}
          {tx.shipment?.supplier && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-1 text-xs">
              <span className="font-semibold text-foreground">
                {t("balance.supplier")}
              </span>
              <p className="text-muted-foreground">
                {tx.shipment.supplier.name}
              </p>
            </div>
          )}

          {/* Sale details */}
          {tx.sale && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-xs">
              <span className="font-semibold text-foreground">
                {t("balance.typeSale")}
              </span>
              {tx.sale.customer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("balance.customer")}:</span>
                  <span className="font-medium">{tx.sale.customer.name}</span>
                </div>
              )}
              {tx.sale.device?.model?.name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("balance.device")}:</span>
                  <span className="font-medium">{tx.sale.device.model.name}</span>
                </div>
              )}
              {tx.sale.device?.imei && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IMEI:</span>
                  <span className="font-mono">{tx.sale.device.imei}</span>
                </div>
              )}
            </div>
          )}

          {/* Expense details */}
          {tx.expense && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-xs">
              <span className="font-semibold text-foreground">
                {t("balance.typeExpense")}
              </span>
              {tx.expense.category?.name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("balance.category")}:</span>
                  <span className="font-medium">{tx.expense.category.name}</span>
                </div>
              )}
              {tx.expense.vendor && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("balance.vendor")}:</span>
                  <span className="font-medium">{tx.expense.vendor}</span>
                </div>
              )}
              {tx.expense.description && (
                <div className="pt-1 text-muted-foreground italic">
                  "{tx.expense.description}"
                </div>
              )}
            </div>
          )}

          {/* Partner payment details */}
          {tx.partnerPayment?.partner && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-1 text-xs">
              <span className="font-semibold text-foreground">
                {t("balance.typePartnerPayment")}
              </span>
              <p className="text-muted-foreground">
                {tx.partnerPayment.partner.shopName}
              </p>
            </div>
          )}

          {/* Customer purchase details */}
          {tx.customerPurchase && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-1 text-xs">
              <span className="font-semibold text-foreground">
                {t("balance.typeCustomerPurchase")}
              </span>
              {tx.customerPurchase.customer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("balance.customer")}:</span>
                  <span className="font-medium">{tx.customerPurchase.customer.name}</span>
                </div>
              )}
              {tx.customerPurchase.device?.model?.name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("balance.device")}:</span>
                  <span className="font-medium">{tx.customerPurchase.device.model.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          {tx.note && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-1 text-xs">
              <span className="font-semibold text-foreground">{t("balance.colNote")}</span>
              <p className="text-muted-foreground whitespace-pre-wrap">{tx.note}</p>
            </div>
          )}

          {/* Meta footer */}
          <div className="pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>{t("balance.colUser")}:</span>
              <span className="font-medium text-foreground">
                {tx.createdBy?.profile
                  ? `${tx.createdBy.profile.firstName} ${tx.createdBy.profile.lastName ?? ""}`.trim()
                  : tx.createdBy?.email ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>ID:</span>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span>{tx.id.slice(0, 8)}…{tx.id.slice(-6)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-4"
                  onClick={() => copyText("ID", tx.id)}
                >
                  <Copy className="size-2.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetPopup>
    </Sheet>
  )
}
