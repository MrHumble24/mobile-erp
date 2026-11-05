import * as React from "react"
import { useNavigate } from "react-router"
import { HandCoins, Printer, Undo2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useCredit } from "@/entities/credit"
import { TakePaymentDialog, RefundOverpaymentDialog } from "@/features/credit-payment"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { CreditTotals, CreditGoods, CreditPlan, CreditPayments } from "./CreditDetailSections"

function DetailActions({ creditId, outstanding, overpaid }: { creditId: string; outstanding: number; overpaid: number }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const canPay = useAuthStore((s) => s.hasPermission("sale.create"))
  const canRefund = useAuthStore((s) => s.hasPermission("sale.return"))
  const [payOpen, setPayOpen] = React.useState(false)
  const [refundOpen, setRefundOpen] = React.useState(false)

  return (
    <div className="flex flex-wrap gap-2">
      {canPay && outstanding > 0 && (
        <Button size="sm" className="gap-1.5" onClick={() => setPayOpen(true)}>
          <HandCoins className="size-4" />
          {t("credit.takePayment")}
        </Button>
      )}
      {canRefund && overpaid > 0 && (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRefundOpen(true)}>
          <Undo2 className="size-4" />
          {t("credit.refundOverpayment")}
        </Button>
      )}
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/credits/${creditId}/contract`)}>
        <Printer className="size-4" />
        {t("credit.printContract")}
      </Button>
      <TakePaymentDialog creditId={creditId} outstanding={outstanding} open={payOpen} onOpenChange={setPayOpen} />
      <RefundOverpaymentDialog creditId={creditId} overpaid={overpaid} open={refundOpen} onOpenChange={setRefundOpen} />
    </div>
  )
}

function DetailBody({ creditId }: { creditId: string }) {
  const { t } = useI18n()
  const { data: credit, isLoading } = useCredit(creditId)
  if (isLoading || !credit) return <Skeleton className="h-64 rounded-[14px]" />

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold">{credit.customer.name}</div>
        <div className="font-mono text-sm text-muted-foreground">{credit.customer.phone || "—"}</div>
      </div>
      <DetailActions
        creditId={credit.id}
        outstanding={Number(credit.outstanding)}
        overpaid={Number(credit.overpaid)}
      />
      <CreditTotals credit={credit} />
      <CreditGoods credit={credit} />
      <CreditPlan credit={credit} />
      <CreditPayments credit={credit} />
      <p className="rounded-[10px] border border-[#e8e8e8] bg-[#f8f9fa] p-2.5 text-xs text-muted-foreground">
        {t("credit.noInterest")}
      </p>
    </div>
  )
}

export function CreditDetailSheet({
  creditId,
  open,
  onOpenChange,
}: {
  creditId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" className="space-y-6 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("credit.detailTitle")}</SheetTitle>
          <SheetDescription>{t("credit.pageDescription")}</SheetDescription>
        </SheetHeader>
        {creditId && <DetailBody creditId={creditId} />}
      </SheetPopup>
    </Sheet>
  )
}
