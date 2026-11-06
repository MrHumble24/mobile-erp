import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { httpErrorCode } from "@/shared/api/http"
import { useReturnSale } from "@/entities/sale"
import { accountLabel } from "@/entities/ledger"
import { returnErrorKey } from "../lib/return-error"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Textarea } from "@/shared/ui/textarea"
import { toast } from "@/shared/ui/sonner"

interface ReturnFieldsProps {
  refundAmount: number
  setRefundAmount: (v: number) => void
  deviceToStatusCode: "IN_STOCK" | "DEFECTIVE"
  setDeviceToStatusCode: (v: "IN_STOCK" | "DEFECTIVE") => void
  reason: string
  setReason: (v: string) => void
}

function ReturnFields({
  refundAmount,
  setRefundAmount,
  deviceToStatusCode,
  setDeviceToStatusCode,
  reason,
  setReason,
  maxRefund,
  onCredit,
}: ReturnFieldsProps & { maxRefund: number; onCredit: boolean }) {
  const { t } = useI18n()
  const exceeds = refundAmount > maxRefund
  return (
    <>
      {onCredit ? (
        <p className="rounded-[10px] border border-[#e8e8e8] bg-[#f8f9fa] p-2.5 text-xs text-muted-foreground">
          {t("credit.returnNote")}
        </p>
      ) : (
        <div className="space-y-1">
          <Label>{t("sales.refundAmount")}</Label>
          <Input
            type="number"
            min={0}
            max={maxRefund}
            value={refundAmount}
            onChange={(e) => setRefundAmount(Math.min(Number(e.target.value), maxRefund))}
            className="h-10 text-base font-bold"
            required
          />
          {exceeds && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="size-3.5" />
              {t("sales.refundTooHigh")}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label>{t("sales.returnCondition")}</Label>
        <Select
          value={deviceToStatusCode}
          onValueChange={(val) => setDeviceToStatusCode(val as "IN_STOCK" | "DEFECTIVE")}
        >
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="IN_STOCK">{t("sales.returnToStock")}</SelectItem>
            <SelectItem value="DEFECTIVE">{t("sales.returnToDefective")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>{t("sales.returnReason")}</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("sales.returnReasonPlaceholder")}
          rows={3}
        />
      </div>
    </>
  )
}

interface PaymentLine {
  accountCode: string
  amount: string
}

/** What was paid = sum of tender lines; falls back to the sale price for a sale
 *  with no ledger rows. The server rejects a refund above this (ADR 0028). */
function paidTotalOf(payments: PaymentLine[], salePrice: number): number {
  if (payments.length === 0) return salePrice
  return payments.reduce((sum, p) => sum + Number(p.amount), 0)
}

function RefundNote({ payments }: { payments: PaymentLine[] }) {
  const { t } = useI18n()
  if (payments.length === 0) return null
  const accounts = payments
    .map((p) => accountLabel(p.accountCode, undefined, t))
    .join(", ")
  return (
    <p className="rounded-[10px] border border-[#e8e8e8] bg-[#f8f9fa] p-2.5 text-xs text-muted-foreground">
      {t("sales.refundGoesBack", { accounts })}
    </p>
  )
}

function TradeInNote({ tradeInValue }: { tradeInValue: number }) {
  const { t } = useI18n()
  if (tradeInValue <= 0) return null
  return (
    <p className="rounded-[10px] border border-[#e8e8e8] bg-[#f8f9fa] p-2.5 text-xs text-muted-foreground">
      {t("purchases.returnTradeInNote")}
    </p>
  )
}

function ReturnSaleForm({
  saleId,
  salePrice,
  payments,
  tradeInValue,
  onCredit,
  onCancel,
  onSuccess,
}: {
  saleId: string
  salePrice: number
  payments: PaymentLine[]
  tradeInValue: number
  onCredit: boolean
  onCancel: () => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const returnMutation = useReturnSale()
  // A credit sale refunds nothing — the return lowers the debt (ADR 0035). A
  // trade-in's value adds to the cap and is paid back in cash (ADR 0039).
  const maxRefund = onCredit ? 0 : paidTotalOf(payments, salePrice) + tradeInValue
  const [refundAmount, setRefundAmount] = React.useState(maxRefund)
  const [reason, setReason] = React.useState("")
  const [deviceToStatusCode, setDeviceToStatusCode] = React.useState<"IN_STOCK" | "DEFECTIVE">("IN_STOCK")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dto = { refundAmount: Number(refundAmount), reason: reason || undefined, deviceToStatusCode }
    returnMutation.mutate(
      { id: saleId, dto },
      {
        onSuccess: () => {
          toast.success(t("sales.returnSuccess"))
          onCancel()
          onSuccess?.()
        },
        onError: (err: unknown) => {
          const key = returnErrorKey(httpErrorCode(err))
          if (key) {
            toast.error(t(key))
            return
          }
          const e = err as { statusCode?: number; message?: string }
          if (e?.statusCode === 409) {
            toast.error(e.message || t("sales.returnConflict"))
          } else {
            toast.error(e?.message || t("common.error"))
          }
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2">
      <ReturnFields
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        deviceToStatusCode={deviceToStatusCode}
        setDeviceToStatusCode={setDeviceToStatusCode}
        reason={reason}
        setReason={setReason}
        maxRefund={maxRefund}
        onCredit={onCredit}
      />
      <TradeInNote tradeInValue={tradeInValue} />
      {!onCredit && <RefundNote payments={payments} />}
      <Button type="submit" variant="destructive" className="w-full" disabled={returnMutation.isPending || refundAmount > maxRefund}>
        {returnMutation.isPending ? t("common.loading") : t("sales.returnDevice")}
      </Button>
    </form>
  )
}

export function ReturnSaleDialog({
  saleId,
  salePrice,
  payments = [],
  tradeInValue = 0,
  onCredit = false,
  open,
  onOpenChange,
  onSuccess,
}: {
  saleId: string
  salePrice: number
  /** The sale's tender lines; the refund goes back to these accounts and is
   *  capped at their sum (or the sale price when there are none). */
  payments?: PaymentLine[]
  /** Σ trade-in values on the sale; adds to the cap, refunded in cash (ADR 0039). */
  tradeInValue?: number
  /** A sale sold on credit: no cash is handed back; the return lowers the debt. */
  onCredit?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("sales.returnDevice")}</DialogTitle>
          <DialogDescription>ID: {saleId.slice(0, 8)}</DialogDescription>
        </DialogHeader>

        {open && (
          <ReturnSaleForm
            saleId={saleId}
            salePrice={salePrice}
            payments={payments}
            tradeInValue={tradeInValue}
            onCredit={onCredit}
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
