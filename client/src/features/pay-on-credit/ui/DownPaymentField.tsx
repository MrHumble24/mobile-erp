import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { PaymentMethodField, type PaymentMethod, type PaymentPart } from "@/entities/ledger"

export interface DownPaymentFieldProps {
  downPayment: number
  onDownPaymentChange: (v: number) => void
  method: PaymentMethod
  onMethodChange: (m: PaymentMethod) => void
  splitParts: PaymentPart[]
  onSplitPartsChange: (p: PaymentPart[]) => void
}

/** The down payment: an amount paid now, tendered by cash, card or split. */
export function DownPaymentField({
  downPayment,
  onDownPaymentChange,
  method,
  onMethodChange,
  splitParts,
  onSplitPartsChange,
}: DownPaymentFieldProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-3 rounded-[12px] border border-[#e8e8e8] bg-[#f8f9fa] p-3">
      <div className="space-y-1">
        <Label>{t("credit.downPayment")}</Label>
        <Input
          type="number"
          min={0}
          value={downPayment || ""}
          onChange={(e) => onDownPaymentChange(Math.max(0, Number(e.target.value) || 0))}
          className="h-10 text-base font-bold"
        />
      </div>
      {downPayment > 0 && (
        <PaymentMethodField
          total={downPayment}
          method={method}
          parts={splitParts}
          onMethodChange={onMethodChange}
          onPartsChange={onSplitPartsChange}
        />
      )}
    </div>
  )
}
