import { RotateCcw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import type { ShiftsFiltersState } from "../model/use-shifts-filters"

export interface CashierOption {
  id: string
  name: string
}

function CashierFilter({
  cashiers,
  value,
  onChange,
}: {
  cashiers: CashierOption[]
  value?: string
  onChange: (id?: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-1">
      <Label>{t("shifts.cashier")}</Label>
      <Select value={value ?? "all"} onValueChange={(v) => onChange(v === "all" ? undefined : (v ?? undefined))}>
        <SelectTrigger className="h-10 w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("shifts.allShifts")}</SelectItem>
          {cashiers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ShiftsFilters({
  filters,
  cashiers,
}: {
  filters: ShiftsFiltersState
  /** Only passed with `shift.manage`; absent hides the cashier filter. */
  cashiers?: CashierOption[]
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-[16px] border border-border bg-white p-4 shadow-[var(--shadow-xs)]">
      {cashiers && (
        <CashierFilter cashiers={cashiers} value={filters.cashierId} onChange={filters.setCashierId} />
      )}
      <div className="space-y-1">
        <Label>{t("balance.filterFrom")}</Label>
        <Input
          type="date"
          value={filters.fromDate}
          onChange={(e) => filters.setFromDate(e.target.value)}
          className="h-10"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("balance.filterTo")}</Label>
        <Input
          type="date"
          value={filters.toDate}
          onChange={(e) => filters.setToDate(e.target.value)}
          className="h-10"
        />
      </div>
      <Button variant="outline" className="h-10 gap-1.5" onClick={filters.reset}>
        <RotateCcw className="size-4" />
        {t("balance.resetFilters")}
      </Button>
    </div>
  )
}
