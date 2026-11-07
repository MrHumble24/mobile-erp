import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useSuppliers, type SupplierView } from "@/entities/supplier"
import { useStores } from "@/entities/store"
import { AccountSelect } from "@/entities/ledger"
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
import { SupplierCreateDialog } from "@/features/intake-shipment/ui/SupplierCreateDialog"

export interface ImportShipmentMetaValues {
  supplierId: string
  storeId: string
  paymentAccountCode: string
  shipmentDate: string
  exchangeRate: string
  notes: string
}

interface MetaFieldsProps {
  values: ImportShipmentMetaValues
  onChange: <K extends keyof ImportShipmentMetaValues>(
    key: K,
    value: ImportShipmentMetaValues[K]
  ) => void
}

function SupplierSelectRow({
  supplierId,
  onSelect,
  suppliers,
}: {
  supplierId: string
  onSelect: (id: string) => void
  suppliers: SupplierView[]
}) {
  const { t } = useI18n()
  const [createOpen, setCreateOpen] = React.useState(false)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{t("shipments.supplier")}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-xs"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-3.5" />
          {t("shipments.newSupplier")}
        </Button>
      </div>
      <Select value={supplierId} onValueChange={(val) => onSelect(val || "")}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder={t("common.select")} />
        </SelectTrigger>
        <SelectContent>
          {suppliers.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SupplierCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={onSelect}
      />
    </div>
  )
}

function StoreSelectRow({
  storeId,
  onSelect,
}: {
  storeId: string
  onSelect: (id: string) => void
}) {
  const { t } = useI18n()
  const { data: stores = [] } = useStores()

  React.useEffect(() => {
    if (!storeId && stores.length > 0) {
      onSelect(stores[0].id)
    }
  }, [storeId, stores, onSelect])

  return (
    <div className="space-y-1.5">
      <Label>{t("shipments.store")}</Label>
      <Select value={storeId} onValueChange={(val) => onSelect(val || "")}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder={t("common.select")} />
        </SelectTrigger>
        <SelectContent>
          {stores.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ShipmentParamInputs({ values, onChange }: MetaFieldsProps) {
  const { t } = useI18n()
  return (
    <>
      <div className="space-y-1.5">
        <Label>{t("balance.payFrom")}</Label>
        <AccountSelect
          value={values.paymentAccountCode}
          onValueChange={(code: string) => onChange("paymentAccountCode", code)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("shipments.shipmentDate")}</Label>
        <Input
          type="date"
          className="h-9"
          value={values.shipmentDate}
          onChange={(e) => onChange("shipmentDate", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("shipments.exchangeRate")}</Label>
        <Input
          type="number"
          step="any"
          placeholder="1.3"
          className="h-9"
          value={values.exchangeRate}
          onChange={(e) => onChange("exchangeRate", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("shipments.notes")}</Label>
        <Input
          className="h-9"
          placeholder={t("common.optional")}
          value={values.notes}
          onChange={(e) => onChange("notes", e.target.value)}
        />
      </div>
    </>
  )
}

export function ImportShipmentMetaFields({ values, onChange }: MetaFieldsProps) {
  const { data: suppliers = [] } = useSuppliers()

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <SupplierSelectRow
        supplierId={values.supplierId}
        onSelect={(id) => onChange("supplierId", id)}
        suppliers={suppliers}
      />
      <StoreSelectRow
        storeId={values.storeId}
        onSelect={(id) => onChange("storeId", id)}
      />
      <ShipmentParamInputs values={values} onChange={onChange} />
    </div>
  )
}
