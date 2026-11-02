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
import type {
  ConsignmentFiltersState,
  DatePreset,
  StatusFilter,
} from "../model/use-consignment-filters"

const STATUS_OPTIONS: StatusFilter[] = ["all", "OUT", "overdue", "SETTLED", "RETURNED"]

function statusLabel(s: StatusFilter, t: (k: string) => string): string {
  if (s === "all") return t("common.all")
  if (s === "OUT") return t("consignments.statusOut")
  if (s === "overdue") return t("consignments.statusOverdue")
  if (s === "SETTLED") return t("consignments.statusSettled")
  return t("consignments.statusReturned")
}

function DateRange({ filters }: { filters: ConsignmentFiltersState }) {
  const { t } = useI18n()
  const options: DatePreset[] = ["all", ...RANGE_PRESETS]
  return (
    <>
      <div className="space-y-1">
        <Label>{t("reports.period")}</Label>
        <Select value={filters.preset} onValueChange={(v) => filters.setPreset(v as DatePreset)}>
          <SelectTrigger className="h-10 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((p) => (
              <SelectItem key={p} value={p}>
                {p === "all" ? t("common.all") : t(`reports.preset_${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filters.preset === "custom" && (
        <>
          <div className="space-y-1">
            <Label>{t("reports.dateFrom")}</Label>
            <Input type="date" value={filters.fromDate} onChange={(e) => filters.setFromDate(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1">
            <Label>{t("reports.dateTo")}</Label>
            <Input type="date" value={filters.toDate} onChange={(e) => filters.setToDate(e.target.value)} className="h-10" />
          </div>
        </>
      )}
    </>
  )
}

export function ConsignmentsFilters({ filters }: { filters: ConsignmentFiltersState }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-[16px] border border-[#e8e8e8] bg-white p-4 shadow-[var(--shadow-xs)]">
      <div className="space-y-1">
        <Label>{t("common.search")}</Label>
        <Input
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          placeholder={t("consignments.searchPlaceholder")}
          className="h-10 w-60"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("consignments.filterStatus")}</Label>
        <Select value={filters.status} onValueChange={(v) => filters.setStatus(v as StatusFilter)}>
          <SelectTrigger className="h-10 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s, t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DateRange filters={filters} />
      <Button variant="outline" className="h-10 gap-1.5" onClick={filters.reset}>
        <RotateCcw className="size-4" />
        {t("consignments.resetFilters")}
      </Button>
    </div>
  )
}
