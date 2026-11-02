import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { STORAGE_OPTIONS } from "@/entities/device"
import type { DeviceModelView } from "@/entities/device-model"
import type { InventoryFilterState } from "../model/use-device-browser"

type OnChange = (val: string | undefined) => void

function toValue(val: string | null): string | undefined {
  return !val || val === "all" ? undefined : val
}

function ModelSelect({ value, onChange, models }: { value?: string; onChange: OnChange; models: DeviceModelView[] }) {
  const { t } = useI18n()
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(toValue(v))}>
      <SelectTrigger className="h-10">
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

function StatusSelect({ value, onChange }: { value?: string; onChange: OnChange }) {
  const { t } = useI18n()
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(toValue(v))}>
      <SelectTrigger className="h-10">
        <SelectValue placeholder={t("inventory.filterStatus")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("inventory.allStatuses")}</SelectItem>
        <SelectItem value="IN_STOCK">{t("inventory.statusInStock")}</SelectItem>
        <SelectItem value="DEFECTIVE">{t("inventory.statusDefective")}</SelectItem>
        <SelectItem value="CONSIGNED">{t("inventory.statusConsigned")}</SelectItem>
        <SelectItem value="SOLD">{t("inventory.statusSold")}</SelectItem>
      </SelectContent>
    </Select>
  )
}

/** Union of every active model's `storage` attribute options; fixed list when none. */
function storageOptionsFrom(models: DeviceModelView[]): readonly string[] {
  const union = new Set<string>()
  for (const model of models) {
    if (!model.isActive) continue
    const storage = model.attributes.find((a) => a.key === "storage")
    storage?.options.forEach((o) => union.add(o))
  }
  return union.size > 0 ? [...union] : STORAGE_OPTIONS
}

function StorageSelect({ value, onChange, options }: { value?: string; onChange: OnChange; options: readonly string[] }) {
  const { t } = useI18n()
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(toValue(v))}>
      <SelectTrigger className="h-10">
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

export function InventoryFilters({ filters, models }: { filters: InventoryFilterState; models: DeviceModelView[] }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Input
        value={filters.searchInput}
        onChange={(e) => filters.setSearchInput(e.target.value)}
        placeholder={t("inventory.searchPlaceholder")}
        className="h-10"
      />
      <ModelSelect value={filters.modelId} onChange={filters.setModelId} models={models} />
      <StatusSelect value={filters.statusCode} onChange={filters.setStatusCode} />
      <StorageSelect value={filters.storage} onChange={filters.setStorage} options={storageOptionsFrom(models)} />
    </div>
  )
}
