import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useRecordPayment, type PartnerView } from "@/entities/partner"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

function PaymentInputs({
  amount,
  setAmount,
  notes,
  setNotes,
}: {
  amount: string
  setAmount: (v: string) => void
  notes: string
  setNotes: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <>
      <div className="space-y-1">
        <Label>{t("partners.paymentAmount")}</Label>
        <Input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500"
          className="h-10 text-base font-bold font-mono"
          required
        />
      </div>

      <div className="space-y-1">
        <Label>{t("common.notes")}</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Naqd, karta yoki o'tkazma..."
          className="h-10"
        />
      </div>
    </>
  )
}

function RecordPaymentForm({
  partner,
  onCancel,
  onSuccess,
}: {
  partner: PartnerView
  onCancel: () => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const recordMutation = useRecordPayment()
  const [amount, setAmount] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return

    recordMutation.mutate(
      {
        partnerId: partner.id,
        dto: { amount: Number(amount), notes: notes.trim() || undefined },
      },
      {
        onSuccess: () => {
          toast.success(t("partners.paymentSuccess"))
          onCancel()
          onSuccess?.()
        },
        onError: (err: any) => {
          toast.error(err?.message || t("common.error"))
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2">
      <PaymentInputs
        amount={amount}
        setAmount={setAmount}
        notes={notes}
        setNotes={setNotes}
      />
      <Button type="submit" className="w-full" disabled={recordMutation.isPending}>
        {recordMutation.isPending ? t("common.loading") : t("partners.recordPayment")}
      </Button>
    </form>
  )
}

export function RecordPaymentDialog({
  partner,
  open,
  onOpenChange,
  onSuccess,
}: {
  partner: PartnerView | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  if (!partner) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("partners.recordPayment")}</DialogTitle>
          <DialogDescription>
            {partner.shopName} · {t("partners.outstanding")}: {formatMoney(partner.outstanding)}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <RecordPaymentForm
            partner={partner}
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
