import * as React from "react"
import { ArrowDownLeft, ArrowUpRight, RotateCcw, Search } from "lucide-react"
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
  icon?: React.ReactNode
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: string
  options: Option[]
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className={className ?? "h-10 w-44 sm:w-48"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <span className="flex items-center gap-1.5">
                {o.icon}
                {o.label}
              </span>
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
  const [searchInput, setSearchInput] = React.useState(filters.search ?? "")

  React.useEffect(() => {
    setSearchInput(filters.search ?? "")
  }, [filters.search])

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      filters.setSearch(searchInput.trim() || undefined)
    }
  }

  const handleSearchBlur = () => {
    if (searchInput !== (filters.search ?? "")) {
      filters.setSearch(searchInput.trim() || undefined)
    }
  }

  const accountLabel = (a: LedgerAccountBalance) => {
    const key = accountI18nKey(a.accountCode)
    return key ? t(key) : a.label
  }

  return (
    <div className="space-y-3 rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="min-w-[220px] flex-1 space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("balance.filterSearch")}
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("balance.searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onBlur={handleSearchBlur}
              className="h-10 pl-9"
            />
          </div>
        </div>

        {/* Direction: All / Inflow (+) / Outflow (-) */}
        <FilterSelect
          label={t("balance.filterDirection")}
          value={filters.direction ?? "all"}
          onChange={(v) =>
            filters.setDirection(v === "all" ? undefined : (v as "in" | "out"))
          }
          options={[
            { value: "all", label: t("balance.dirAll") },
            {
              value: "in",
              label: t("balance.flowIn"),
              icon: <ArrowDownLeft className="size-3.5 text-emerald-500" />,
            },
            {
              value: "out",
              label: t("balance.flowOut"),
              icon: <ArrowUpRight className="size-3.5 text-destructive" />,
            },
          ]}
        />

        {/* Account: All / Cash / Card */}
        <FilterSelect
          label={t("balance.filterAccount")}
          value={filters.accountCode ?? "all"}
          onChange={(v) => filters.setAccountCode(v === "all" ? undefined : v)}
          options={[
            { value: "all", label: t("balance.allAccounts") },
            ...accounts.map((a) => ({
              value: a.accountCode,
              label: accountLabel(a),
            })),
          ]}
        />

        {/* Type */}
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

        {/* Period */}
        <FilterSelect
          label={t("reports.period")}
          value={filters.preset}
          onChange={(v) => filters.setPreset(v as (typeof RANGE_PRESETS)[number])}
          options={RANGE_PRESETS.map((p) => ({
            value: p,
            label: t(`reports.preset_${p}`),
          }))}
          className="h-10 w-36 sm:w-40"
        />

        {/* Reset */}
        <Button
          variant="outline"
          className="h-10 gap-1.5 text-xs font-medium"
          onClick={() => {
            setSearchInput("")
            filters.reset()
          }}
        >
          <RotateCcw className="size-3.5" />
          {t("balance.resetFilters")}
        </Button>
      </div>

      {filters.preset === "custom" && (
        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("balance.filterFrom")}
            </Label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => filters.setFromDate(e.target.value)}
              className="h-9 w-40 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("balance.filterTo")}
            </Label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => filters.setToDate(e.target.value)}
              className="h-9 w-40 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}
