import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { AccountSelect } from "@/entities/ledger"
import { toCents } from "@/entities/credit"

export interface CreditTenderFormProps {
  /** The ceiling: outstanding for a payment, overpaid for a refund. */
  cap: number
  capLabel: string
  capMessageKey: string
  submitLabel: string
  pending: boolean
  onSubmit: (amount: number, accountCode: string) => void
}

/** Shared amount + account form for taking a credit payment or refunding one. */
export function CreditTenderForm({
  cap,
  capLabel,
  capMessageKey,
  submitLabel,
  pending,
  onSubmit,
}: CreditTenderFormProps) {
  const { t } = useI18n()
  const [amount, setAmount] = React.useState(cap)
  const [accountCode, setAccountCode] = React.useState("CASH")
  const exceeds = toCents(amount) > toCents(cap)
  const invalid = amount <= 0 || exceeds

  return (
    <form
      className="space-y-4 my-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!invalid && !pending) onSubmit(amount, accountCode)
      }}
    >
      <div className="flex items-center justify-between rounded-[10px] border border-[#e8e8e8] bg-[#f8f9fa] p-2.5 text-sm">
        <span className="text-muted-foreground">{capLabel}</span>
        <span className="font-mono font-semibold">{formatMoney(cap)}</span>
      </div>
      <div className="space-y-1">
        <Label>{t("credit.amount")}</Label>
        <Input
          type="number"
          min={0}
          max={cap}
          value={amount || ""}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          className="h-10 text-base font-bold"
        />
        {exceeds && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="size-3.5" />
            {t(capMessageKey)}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <Label>{t("balance.paidWith")}</Label>
        <AccountSelect value={accountCode} onValueChange={setAccountCode} />
      </div>
      <Button type="submit" className="w-full" disabled={invalid || pending}>
        {pending ? t("common.loading") : submitLabel}
      </Button>
    </form>
  )
}
