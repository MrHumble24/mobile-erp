import { RotateCcw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useRoles } from "@/entities/user"
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
import type { UsersFiltersState } from "../model/use-users-filters"

export function UserFilters({ filters }: { filters: UsersFiltersState }) {
  const { t } = useI18n()
  const { data: roles } = useRoles()

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
      <div className="space-y-1">
        <Label>{t("common.search")}</Label>
        <Input
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          placeholder={t("users.filterSearch")}
          className="h-10 w-60"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("users.filterRole")}</Label>
        <Select value={filters.role} onValueChange={(v) => filters.setRole(v ?? "all")}>
          <SelectTrigger className="h-10 w-48 sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {roles?.map((r) => (
              <SelectItem key={r.code} value={r.code}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>{t("users.filterStatus")}</Label>
        <Select
          value={filters.active}
          onValueChange={(v) => filters.setActive(v as UsersFiltersState["active"])}
        >
          <SelectTrigger className="h-10 w-48 sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="active">{t("users.statusActive")}</SelectItem>
            <SelectItem value="inactive">{t("users.statusInactive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" className="h-10 gap-1.5" onClick={filters.reset}>
        <RotateCcw className="size-4" />
        {t("users.resetFilters")}
      </Button>
    </div>
  )
}
