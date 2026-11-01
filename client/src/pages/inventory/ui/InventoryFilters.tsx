import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import type { DeviceModelView } from "@/entities/device-model"

function ModelSelect({
  value,
  onChange,
  models,
}: {
  value?: string
  onChange: (val: string | undefined) => void
  models: DeviceModelView[]
}) {
  const { t } = useI18n()
  return (
    <Select
      value={value || "all"}
      onValueChange={(val) => onChange(val === "all" ? undefined : (val || undefined))}
    >
      <SelectTrigger className="h-10">
        <SelectValue placeholder={t("inventory.filterModel")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("common.all")} modellar</SelectItem>
        {models.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.brand} {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function StatusSelect({
  value,
  onChange,
}: {
  value?: string
  onChange: (val: string | undefined) => void
}) {
  const { t } = useI18n()
  return (
    <Select
      value={value || "all"}
      onValueChange={(val) => onChange(val === "all" ? undefined : (val || undefined))}
    >
      <SelectTrigger className="h-10">
        <SelectValue placeholder={t("inventory.filterStatus")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("common.all")} holatlar</SelectItem>
        <SelectItem value="IN_STOCK">{t("inventory.statusInStock")}</SelectItem>
        <SelectItem value="DEFECTIVE">{t("inventory.statusDefective")}</SelectItem>
        <SelectItem value="CONSIGNED">{t("inventory.statusConsigned")}</SelectItem>
        <SelectItem value="SOLD">{t("inventory.statusSold")}</SelectItem>
      </SelectContent>
    </Select>
  )
}

interface InventoryFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  modelId?: string
  onModelChange: (value: string | undefined) => void
  statusCode?: string
  onStatusChange: (value: string | undefined) => void
  models: DeviceModelView[]
}

export function InventoryFilters({
  search,
  onSearchChange,
  modelId,
  onModelChange,
  statusCode,
  onStatusChange,
  models,
}: InventoryFiltersProps) {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t("inventory.searchPlaceholder")}
        className="h-10"
      />
      <ModelSelect value={modelId} onChange={onModelChange} models={models} />
      <StatusSelect value={statusCode} onChange={onStatusChange} />
    </div>
  )
}
