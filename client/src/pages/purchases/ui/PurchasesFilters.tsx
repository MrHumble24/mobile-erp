import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import type { PurchasesFiltersState } from "../model/use-purchases-filters"

export function PurchasesFilters({ filters }: { filters: PurchasesFiltersState }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-[16px] border border-[#e8e8e8] bg-white p-4 shadow-[var(--shadow-xs)]">
      <div className="space-y-1">
        <Label>{t("common.from")}</Label>
        <Input type="date" value={filters.from} onChange={(e) => filters.setFrom(e.target.value)} className="h-10" />
      </div>
      <div className="space-y-1">
        <Label>{t("common.to")}</Label>
        <Input type="date" value={filters.to} onChange={(e) => filters.setTo(e.target.value)} className="h-10" />
      </div>
      <div className="min-w-56 flex-1 space-y-1">
        <Label>{t("purchases.searchByCode")}</Label>
        <Input
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          placeholder={t("purchases.searchByCodeHint")}
          className="h-10"
        />
      </div>
    </div>
  )
}
