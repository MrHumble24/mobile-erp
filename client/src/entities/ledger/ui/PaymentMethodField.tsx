import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useAccountOptions } from "../model/use-account-options"
import { accountLabel } from "../lib/ledger-labels"
import type { PaymentMethod, PaymentPart } from "../model/payment.types"

export interface PaymentMethodFieldProps {
  total: number
  method: PaymentMethod
  parts: PaymentPart[]
  onMethodChange: (method: PaymentMethod) => void
  onPartsChange: (parts: PaymentPart[]) => void
  /** Split needs a single amount to divide; hide it for multi-item carts. */
  allowSplit?: boolean
}

function partAmount(parts: PaymentPart[], code: string): number {
  return parts.find((p) => p.accountCode === code)?.amount ?? 0
}

/** Remaining to assign across the split parts; 0 means the parts balance. */
export function splitRemaining(total: number, parts: PaymentPart[]): number {
  const sum = parts.reduce((s, p) => s + (p.amount || 0), 0)
  return Math.round((total - sum) * 100) / 100
}

function MethodButtons({
  method,
  allowSplit,
  onMethodChange,
}: Pick<PaymentMethodFieldProps, "method" | "allowSplit" | "onMethodChange">) {
  const { t } = useI18n()
  const options: { value: PaymentMethod; label: string }[] = [
    { value: "cash", label: t("balance.payCash") },
    { value: "card", label: t("balance.payCard") },
    ...(allowSplit ? [{ value: "split" as const, label: t("balance.splitPayment") }] : []),
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="sm"
          variant={method === o.value ? "default" : "outline"}
          onClick={() => onMethodChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}

function SplitRows({
  total,
  parts,
  onPartsChange,
}: Pick<PaymentMethodFieldProps, "total" | "parts" | "onPartsChange">) {
  const { t } = useI18n()
  const accounts = useAccountOptions()
  const remaining = splitRemaining(total, parts)

  const setAmount = (code: string, amount: number) => {
    const others = parts.filter((p) => p.accountCode !== code)
    onPartsChange([...others, { accountCode: code, amount }])
  }

  return (
    <div className="space-y-2 rounded-[12px] border border-[#e8e8e8] bg-[#f8f9fa] p-3">
      {accounts.map((a) => (
        <div key={a.accountCode} className="flex items-center justify-between gap-3">
          <Label className="mb-0">{accountLabel(a.accountCode, a.label, t)}</Label>
          <Input
            type="number"
            min={0}
            value={partAmount(parts, a.accountCode) || ""}
            onChange={(e) => setAmount(a.accountCode, Number(e.target.value) || 0)}
            className="h-9 w-32 font-mono"
          />
        </div>
      ))}
      <div
        className={`flex items-center justify-between pt-1 text-sm ${
          remaining === 0 ? "text-muted-foreground" : "text-destructive font-semibold"
        }`}
      >
        <span>{t("balance.splitRemaining")}</span>
        <span className="font-mono">{formatMoney(remaining)}</span>
      </div>
      {remaining !== 0 && (
        <p className="text-xs text-destructive">{t("balance.errorSplitTotal")}</p>
      )}
    </div>
  )
}

/** "Paid with" control: Cash, Card or a Split that must sum to `total`. */
export function PaymentMethodField({
  total,
  method,
  parts,
  onMethodChange,
  onPartsChange,
  allowSplit = true,
}: PaymentMethodFieldProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <Label className="mb-0">{t("balance.paidWith")}</Label>
      <MethodButtons method={method} allowSplit={allowSplit} onMethodChange={onMethodChange} />
      {method === "split" && allowSplit && (
        <SplitRows total={total} parts={parts} onPartsChange={onPartsChange} />
      )}
    </div>
  )
}
