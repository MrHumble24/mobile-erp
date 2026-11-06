import { RotateCcw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { RANGE_PRESETS } from "@/shared/lib/date-range"
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
import type { SalesFiltersState } from "../model/use-sales-filters"
import { CashierFilter } from "./CashierFilter"

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

function PeriodFilter({ filters }: { filters: SalesFiltersState }) {
  const { t } = useI18n()
  return (
    <>
      <FilterSelect
        label={t("reports.period")}
        value={filters.preset}
        onChange={(v) => filters.setPreset(v as (typeof RANGE_PRESETS)[number])}
        options={RANGE_PRESETS.map((p) => ({ value: p, label: t(`reports.preset_${p}`) }))}
      />
      {filters.preset === "custom" && (
        <>
          <div className="space-y-1">
            <Label>{t("reports.dateFrom")}</Label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => filters.setFromDate(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <Label>{t("reports.dateTo")}</Label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => filters.setToDate(e.target.value)}
              className="h-10"
            />
          </div>
        </>
      )}
    </>
  )
}

export function SalesFilters({
  filters,
  canReadUsers,
}: {
  filters: SalesFiltersState
  canReadUsers: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
      <PeriodFilter filters={filters} />
      <div className="space-y-1">
        <Label>{t("common.search")}</Label>
        <Input
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          placeholder={t("sales.filterSearch")}
          className="h-10 w-60"
        />
      </div>
      <FilterSelect
        label={t("sales.filterChannel")}
        value={filters.channel ?? "all"}
        onChange={(v) => filters.setChannel(v === "all" ? undefined : (v as "retail" | "b2b"))}
        options={[
          { value: "all", label: t("common.all") },
          { value: "retail", label: t("sales.channelRetail") },
          { value: "b2b", label: t("sales.channelB2B") },
        ]}
      />
      <FilterSelect
        label={t("sales.filterStatus")}
        value={filters.status}
        onChange={(v) => filters.setStatus(v as SalesFiltersState["status"])}
        options={[
          { value: "all", label: t("common.all") },
          { value: "active", label: t("sales.statusActive") },
          { value: "returned", label: t("sales.statusReturned") },
        ]}
      />
      <FilterSelect
        label={t("sales.filterWarranty")}
        value={filters.warranty}
        onChange={(v) => filters.setWarranty(v as SalesFiltersState["warranty"])}
        options={[
          { value: "all", label: t("common.all") },
          { value: "active", label: t("sales.warrantyValid") },
          { value: "expired", label: t("sales.warrantyExpired") },
        ]}
      />
      {canReadUsers && (
        <CashierFilter value={filters.soldById} onChange={filters.setSoldById} />
      )}
      <Button variant="outline" className="h-10 gap-1.5" onClick={filters.reset}>
        <RotateCcw className="size-4" />
        {t("sales.resetFilters")}
      </Button>
    </div>
  )
}
