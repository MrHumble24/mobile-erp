import { Search, X } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import type { RepairsFiltersState, RepairStatusTab } from "../model/use-repairs-filters"

const TABS: { value: RepairStatusTab; labelKey: string }[] = [
  { value: "all", labelKey: "repairs.filterAll" },
  { value: "RECEIVED", labelKey: "repairs.statusReceived" },
  { value: "IN_REPAIR", labelKey: "repairs.statusInRepair" },
  { value: "READY", labelKey: "repairs.statusReady" },
  { value: "GIVEN_BACK", labelKey: "repairs.statusGivenBack" },
  { value: "CANCELLED", labelKey: "repairs.statusCancelled" },
]

export function RepairsFilters({ filters }: { filters: RepairsFiltersState }) {
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              size="sm"
              variant={filters.status === tab.value ? "default" : "outline"}
              onClick={() => filters.setStatus(tab.value)}
            >
              {t(tab.labelKey)}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            placeholder={t("repairs.search")}
            className="h-9 pl-9"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("repairs.dateFrom")}</Label>
          <Input type="date" value={filters.from} onChange={(e) => filters.setFrom(e.target.value)} className="h-9 w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("repairs.dateTo")}</Label>
          <Input type="date" value={filters.to} onChange={(e) => filters.setTo(e.target.value)} className="h-9 w-40" />
        </div>
        {(filters.from || filters.to) && (
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={filters.clearDates}>
            <X className="size-3.5" />
            {t("repairs.clearDates")}
          </Button>
        )}
      </div>
    </div>
  )
}
