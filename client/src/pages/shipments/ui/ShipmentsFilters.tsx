import { useI18n } from "@/shared/i18n"
import type { SupplierView } from "@/entities/supplier"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import type { ShipmentFilterState } from "../model/use-shipment-browser"

function SupplierSelect({
  value,
  onChange,
  suppliers,
}: {
  value?: string
  onChange: (v: string | undefined) => void
  suppliers: SupplierView[]
}) {
  const { t } = useI18n()
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(!v || v === "all" ? undefined : v)}>
      <SelectTrigger className="h-10">
        <SelectValue placeholder={t("shipments.supplier")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("shipments.allSuppliers")}</SelectItem>
        {suppliers.map((s) => (
          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ShipmentsFilters({
  filters,
  suppliers,
}: {
  filters: ShipmentFilterState
  suppliers: SupplierView[]
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
      <Input
        value={filters.searchInput}
        onChange={(e) => filters.setSearchInput(e.target.value)}
        placeholder={t("shipments.searchPlaceholder")}
        className="h-10"
      />
      <SupplierSelect value={filters.supplierId} onChange={filters.setSupplierId} suppliers={suppliers} />
      <div className="flex items-center gap-2.5 rounded-lg border px-3 h-10">
        <Switch checked={filters.openOnly} onCheckedChange={filters.setOpenOnly} />
        <Label className="mb-0 text-sm">{t("shipments.openOnly")}</Label>
      </div>
    </div>
  )
}
