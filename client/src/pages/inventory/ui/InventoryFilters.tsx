import { RotateCcw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Button } from "@/shared/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { STORAGE_OPTIONS } from "@/entities/device"
import { storageOptionsFromModels, type DeviceModelView } from "@/entities/device-model"
import type { InventoryFilterState } from "../model/use-device-browser"

type OnChange = (val: string | undefined) => void

function toValue(val: string | null): string | undefined {
  return !val || val === "all" ? undefined : val
}

function ModelSelect({ value, onChange, models }: { value?: string; onChange: OnChange; models: DeviceModelView[] }) {
  const { t } = useI18n()
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(toValue(v))}>
      <SelectTrigger className="h-10 bg-white border-border shadow-[var(--shadow-xs)]">
        <SelectValue placeholder={t("inventory.filterModel")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("inventory.allModels")}</SelectItem>
        {models.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.brand} {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function StorageSelect({ value, onChange, options }: { value?: string; onChange: OnChange; options: readonly string[] }) {
  const { t } = useI18n()
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(toValue(v))}>
      <SelectTrigger className="h-10 bg-white border-border shadow-[var(--shadow-xs)]">
        <SelectValue placeholder={t("inventory.filterStorage")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("inventory.allStorages")}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const STATUS_ITEMS = [
  { code: undefined, labelKey: "inventory.allStatuses" },
  { code: "IN_STOCK", labelKey: "inventory.statusInStock" },
  { code: "DEFECTIVE", labelKey: "inventory.statusDefective" },
  { code: "CONSIGNED", labelKey: "inventory.statusConsigned" },
  { code: "SOLD", labelKey: "inventory.statusSold" },
] as const

function StatusPills({
  activeCode,
  onChange,
}: {
  activeCode?: string
  onChange: OnChange
}) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
      {STATUS_ITEMS.map((item) => {
        const isActive = activeCode === item.code
        return (
          <Button
            key={item.labelKey}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(item.code)}
            className={cn(
              "h-8 px-3 text-xs font-medium rounded-full transition-all shrink-0 border cursor-pointer",
              isActive
                ? "bg-[#090c1d] text-white border-[#090c1d] hover:bg-[#090c1d] hover:text-white shadow-[var(--shadow-xs)]"
                : "bg-white text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            )}
          >
            {t(item.labelKey)}
          </Button>
        )
      })}
    </div>
  )
}

export interface InventoryFiltersProps {
  filters: InventoryFilterState
  models: DeviceModelView[]
  onScan?: (imei: string) => void
}

function FiltersInputs({ filters, models, onScan }: InventoryFiltersProps) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
      <div className="lg:col-span-6">
        <BarcodeInput
          value={filters.searchInput}
          onChange={(e) => filters.setSearchInput(e.target.value)}
          onScan={onScan}
          onClear={() => filters.setSearchInput("")}
          placeholder={t("inventory.scanOrSearch")}
          className="h-10 bg-white border-border shadow-[var(--shadow-xs)]"
        />
      </div>
      <div className="lg:col-span-3">
        <ModelSelect value={filters.modelId} onChange={filters.setModelId} models={models} />
      </div>
      <div className="lg:col-span-3">
        <StorageSelect
          value={filters.storage}
          onChange={filters.setStorage}
          options={storageOptionsFromModels(models, STORAGE_OPTIONS)}
        />
      </div>
    </div>
  )
}

export function InventoryFilters({ filters, models, onScan }: InventoryFiltersProps) {
  const { t } = useI18n()
  const activeCount = [
    Boolean(filters.searchInput),
    Boolean(filters.modelId),
    Boolean(filters.statusCode),
    Boolean(filters.storage),
  ].filter(Boolean).length

  const handleClearAll = () => {
    filters.setSearchInput("")
    filters.setModelId(undefined)
    filters.setStatusCode(undefined)
    filters.setStorage(undefined)
  }

  return (
    <div className="space-y-3">
      <FiltersInputs filters={filters} models={models} onScan={onScan} />
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <StatusPills activeCode={filters.statusCode} onChange={filters.setStatusCode} />
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            {t("inventory.clearFilters")} ({activeCount})
          </Button>
        )}
      </div>
    </div>
  )
}
