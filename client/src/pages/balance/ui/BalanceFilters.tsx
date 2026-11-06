import { RotateCcw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { RANGE_PRESETS } from "@/shared/lib/date-range"
import {
  accountI18nKey,
  typeI18nKey,
  KNOWN_TYPE_CODES,
  type LedgerAccountBalance,
} from "@/entities/ledger"
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
import type { BalanceFiltersState } from "../model/use-balance-filters"

interface Option {
  value: string
  label: string
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Option[]
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="h-10 w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function BalanceFilters({
  filters,
  accounts,
}: {
  filters: BalanceFiltersState
  accounts: LedgerAccountBalance[]
}) {
  const { t } = useI18n()
  const accountLabel = (a: LedgerAccountBalance) => {
    const key = accountI18nKey(a.accountCode)
    return key ? t(key) : a.label
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
      <FilterSelect
        label={t("balance.filterAccount")}
        value={filters.accountCode ?? "all"}
        onChange={(v) => filters.setAccountCode(v === "all" ? undefined : v)}
        options={[
          { value: "all", label: t("balance.allAccounts") },
          ...accounts.map((a) => ({ value: a.accountCode, label: accountLabel(a) })),
        ]}
      />
      <FilterSelect
        label={t("balance.filterType")}
        value={filters.typeCode ?? "all"}
        onChange={(v) => filters.setTypeCode(v === "all" ? undefined : v)}
        options={[
          { value: "all", label: t("balance.allTypes") },
          ...KNOWN_TYPE_CODES.map((code) => ({
            value: code,
            label: t(typeI18nKey(code) ?? ""),
          })),
        ]}
      />
      <FilterSelect
        label={t("reports.period")}
        value={filters.preset}
        onChange={(v) => filters.setPreset(v as (typeof RANGE_PRESETS)[number])}
        options={RANGE_PRESETS.map((p) => ({ value: p, label: t(`reports.preset_${p}`) }))}
      />
      {filters.preset === "custom" && (
        <>
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
        </>
      )}
      <Button variant="outline" className="h-10 gap-1.5" onClick={filters.reset}>
        <RotateCcw className="size-4" />
        {t("balance.resetFilters")}
      </Button>
    </div>
  )
}
