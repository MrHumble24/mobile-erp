import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { useAccountOptions } from "../model/use-account-options"
import { accountLabel } from "../lib/ledger-labels"

export interface AccountSelectProps {
  value: string
  onValueChange: (code: string) => void
  disabled?: boolean
  className?: string
}

/** Single ledger account picker (Cash / Card / …). Options come from the
 *  ledger balances, with a CASH/CARD fallback for users without `balance.read`. */
export function AccountSelect({
  value,
  onValueChange,
  disabled,
  className,
}: AccountSelectProps) {
  const { t } = useI18n()
  const options = useAccountOptions()
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v ?? "")} disabled={disabled}>
      <SelectTrigger className={cn("h-10", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.accountCode} value={o.accountCode}>
            {accountLabel(o.accountCode, o.label, t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
