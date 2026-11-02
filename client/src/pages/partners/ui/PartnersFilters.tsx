import { RotateCcw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import type { ActiveFilter, PartnerFiltersState } from "../model/use-partner-filters"

const ACTIVE_OPTIONS: ActiveFilter[] = ["all", "active", "inactive"]

export function PartnersFilters({ filters }: { filters: PartnerFiltersState }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-[16px] border border-[#e8e8e8] bg-white p-4 shadow-[var(--shadow-xs)]">
      <div className="space-y-1">
        <Label>{t("common.search")}</Label>
        <Input
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          placeholder={t("partners.searchPlaceholder")}
          className="h-10 w-64"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("partners.status")}</Label>
        <Select value={filters.active} onValueChange={(v) => filters.setActive(v as ActiveFilter)}>
          <SelectTrigger className="h-10 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVE_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a === "all" ? t("common.all") : t(`partners.${a}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 pb-2.5">
        <Switch checked={filters.overdue} onCheckedChange={filters.setOverdue} />
        <Label className="cursor-pointer">{t("partners.overdueOnly")}</Label>
      </div>
      <Button variant="outline" className="h-10 gap-1.5" onClick={filters.reset}>
        <RotateCcw className="size-4" />
        {t("partners.resetFilters")}
      </Button>
    </div>
  )
}
