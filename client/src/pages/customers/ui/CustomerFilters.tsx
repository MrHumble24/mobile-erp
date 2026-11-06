import { RotateCcw, Search } from "lucide-react"
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
import type { CustomerFiltersState } from "../model/use-customer-filters"

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
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

export function CustomerFilters({ filters }: { filters: CustomerFiltersState }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-[16px] border border-border bg-white p-4 shadow-[var(--shadow-xs)]">
      <div className="space-y-1">
        <Label>{t("common.search")}</Label>
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            placeholder={t("customers.searchPlaceholder")}
            className="h-10 pl-9"
          />
        </div>
      </div>
      <FilterSelect
        label={t("customers.filterPurchases")}
        value={filters.hasPurchases}
        onChange={(v) => filters.setHasPurchases(v as CustomerFiltersState["hasPurchases"])}
        options={[
          { value: "all", label: t("common.all") },
          { value: "yes", label: t("customers.hasPurchasesYes") },
          { value: "no", label: t("customers.hasPurchasesNo") },
        ]}
      />
      <FilterSelect
        label={t("customers.sortLabel")}
        value={filters.sort}
        onChange={(v) => filters.setSort(v as CustomerFiltersState["sort"])}
        options={[
          { value: "recent", label: t("customers.sortRecent") },
          { value: "name", label: t("customers.sortName") },
        ]}
      />
      <Button variant="outline" className="h-10 gap-1.5" onClick={filters.reset}>
        <RotateCcw className="size-4" />
        {t("customers.resetFilters")}
      </Button>
    </div>
  )
}
