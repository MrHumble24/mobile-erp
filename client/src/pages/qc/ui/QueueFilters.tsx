import { useI18n } from "@/shared/i18n"
import { STORAGE_OPTIONS } from "@/entities/device"
import { storageOptionsFromModels, type DeviceModelView } from "@/entities/device-model"
import { Input } from "@/shared/ui/input"
import { Combobox } from "@/shared/ui/combobox"
import { Switch } from "@/shared/ui/switch"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import type { QcQueueFilterState } from "../model/use-qc-queue"

type OnChange = (val: string | undefined) => void

function toValue(val: string | null): string | undefined {
  return !val || val === "all" ? undefined : val
}

function StatusSelect({ value, onChange }: { value?: string; onChange: OnChange }) {
  const { t } = useI18n()
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(toValue(v))}>
      <SelectTrigger className="h-10"><SelectValue placeholder={t("inventory.filterStatus")} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("qc.allStatuses")}</SelectItem>
        <SelectItem value="IN_STOCK">{t("inventory.statusInStock")}</SelectItem>
        <SelectItem value="DEFECTIVE">{t("inventory.statusDefective")}</SelectItem>
      </SelectContent>
    </Select>
  )
}

function StorageSelect({ value, onChange, options }: { value?: string; onChange: OnChange; options: readonly string[] }) {
  const { t } = useI18n()
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(toValue(v))}>
      <SelectTrigger className="h-10"><SelectValue placeholder={t("inventory.filterStorage")} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("inventory.allStorages")}</SelectItem>
        {options.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function QueueFilters({ filters, models }: { filters: QcQueueFilterState; models: DeviceModelView[] }) {
  const { t } = useI18n()
  const modelOptions = [
    { value: "", label: t("inventory.allModels") },
    ...models.map((m) => ({ value: m.id, label: `${m.brand} ${m.name}` })),
  ]
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          value={filters.searchInput}
          onChange={(e) => filters.setSearchInput(e.target.value)}
          placeholder={t("inventory.searchPlaceholder")}
          className="h-10"
        />
        <StatusSelect value={filters.statusCode} onChange={filters.setStatusCode} />
        <Combobox
          value={filters.modelId || ""}
          onChange={(v) => filters.setModelId(v || undefined)}
          options={modelOptions}
          placeholder={t("inventory.filterModel")}
          searchPlaceholder={t("common.search")}
          emptyText={t("common.notFound")}
        />
        <StorageSelect value={filters.storage} onChange={filters.setStorage} options={storageOptionsFromModels(models, STORAGE_OPTIONS)} />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
        <Switch checked={filters.showInspected} onCheckedChange={(v) => filters.setShowInspected(Boolean(v))} />
        <Label className="cursor-pointer">{t("qc.showInspected")}</Label>
      </label>
    </div>
  )
}
