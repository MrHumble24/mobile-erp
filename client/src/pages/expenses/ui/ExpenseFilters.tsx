import { RotateCcw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { RANGE_PRESETS } from "@/shared/lib/date-range"
import { useExpenseCategories } from "@/entities/expense-category"
import { useUsers } from "@/entities/user"
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
import type { ExpenseFiltersState, SortValue } from "../model/use-expense-filters"

interface Option {
  value: string
  label: string
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  width = "w-44",
}: {
  label: string
  value: string
  options: Option[]
  onChange: (v: string) => void
  width?: string
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className={`h-10 ${width}`}>
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

function PeriodFilter({ filters }: { filters: ExpenseFiltersState }) {
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

function CategoryFilter({ filters }: { filters: ExpenseFiltersState }) {
  const { t } = useI18n()
  const { data: categories } = useExpenseCategories()
  return (
    <FilterSelect
      label={t("expenses.category")}
      value={filters.categoryId ?? "all"}
      onChange={(v) => filters.setCategoryId(v === "all" ? undefined : v)}
      options={[
        { value: "all", label: t("common.all") },
        ...(categories ?? []).map((c) => ({ value: c.id, label: c.name })),
      ]}
    />
  )
}

function RecordedByFilter({ filters }: { filters: ExpenseFiltersState }) {
  const { t } = useI18n()
  const { data: users } = useUsers()
  const name = (u: { profile: { firstName: string; lastName?: string | null } | null; email: string }) =>
    u.profile ? [u.profile.firstName, u.profile.lastName].filter(Boolean).join(" ") || u.email : u.email
  return (
    <FilterSelect
      label={t("expenses.recordedBy")}
      value={filters.recordedById ?? "all"}
      onChange={(v) => filters.setRecordedById(v === "all" ? undefined : v)}
      options={[
        { value: "all", label: t("common.all") },
        ...(users ?? []).map((u) => ({ value: u.id, label: name(u) })),
      ]}
    />
  )
}

function AmountRange({ filters }: { filters: ExpenseFiltersState }) {
  const { t } = useI18n()
  return (
    <>
      <div className="space-y-1">
        <Label>{t("expenses.minAmount")}</Label>
        <Input type="number" min={0} value={filters.minAmount} onChange={(e) => filters.setMinAmount(e.target.value)} className="h-10 w-28" />
      </div>
      <div className="space-y-1">
        <Label>{t("expenses.maxAmount")}</Label>
        <Input type="number" min={0} value={filters.maxAmount} onChange={(e) => filters.setMaxAmount(e.target.value)} className="h-10 w-28" />
      </div>
    </>
  )
}

export function ExpenseFilters({
  filters,
  canReadUsers,
}: {
  filters: ExpenseFiltersState
  canReadUsers: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-[16px] border border-border bg-white p-4 shadow-[var(--shadow-xs)]">
      <PeriodFilter filters={filters} />
      <div className="space-y-1">
        <Label>{t("common.search")}</Label>
        <Input value={filters.search} onChange={(e) => filters.setSearch(e.target.value)} placeholder={t("expenses.searchPlaceholder")} className="h-10 w-56" />
      </div>
      <CategoryFilter filters={filters} />
      {canReadUsers && <RecordedByFilter filters={filters} />}
      <FilterSelect
        label={t("expenses.isRecurring")}
        value={filters.recurring}
        onChange={(v) => filters.setRecurring(v as ExpenseFiltersState["recurring"])}
        options={[
          { value: "all", label: t("common.all") },
          { value: "recurring", label: t("expenses.recurringOnly") },
          { value: "one-off", label: t("expenses.oneOff") },
        ]}
      />
      <AmountRange filters={filters} />
      <FilterSelect
        label={t("expenses.sortLabel")}
        value={filters.sort}
        onChange={(v) => filters.setSort(v as SortValue)}
        width="w-48"
        options={[
          { value: "incurredAt:desc", label: t("expenses.sortNewest") },
          { value: "incurredAt:asc", label: t("expenses.sortOldest") },
          { value: "amount:desc", label: t("expenses.sortAmountDesc") },
          { value: "amount:asc", label: t("expenses.sortAmountAsc") },
        ]}
      />
      <Button variant="outline" className="h-10 gap-1.5" onClick={filters.reset}>
        <RotateCcw className="size-4" />
        {t("expenses.resetFilters")}
      </Button>
    </div>
  )
}
