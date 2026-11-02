import { useI18n } from "@/shared/i18n"
import { type DeviceModelView } from "@/entities/device-model"
import { STORAGE_OPTIONS } from "@/entities/device"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

export interface IntakeDraft {
  imei: string
  modelId: string
  storage: string
  color: string
  cost: number
  targetPrice: number
}

type Update = <K extends keyof IntakeDraft>(key: K, value: IntakeDraft[K]) => void

function ModelStorageRow({ draft, set, models }: { draft: IntakeDraft; set: Update; models: DeviceModelView[] }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label>{t("inventory.model")}</Label>
        <Select value={draft.modelId} onValueChange={(v) => set("modelId", v || "")}>
          <SelectTrigger className="h-10"><SelectValue placeholder={t("shipments.selectModel")} /></SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.brand} {m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>{t("inventory.storage")}</Label>
        <Select value={draft.storage} onValueChange={(v) => set("storage", v || "")}>
          <SelectTrigger className="h-10"><SelectValue placeholder={t("common.select")} /></SelectTrigger>
          <SelectContent>
            {STORAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function PricingRow({ draft, set }: { draft: IntakeDraft; set: Update }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-1">
        <Label>{t("inventory.color")}</Label>
        <Input value={draft.color} onChange={(e) => set("color", e.target.value)} className="h-10" />
      </div>
      <div className="space-y-1">
        <Label>{t("shipments.acquisitionCost")}</Label>
        <Input type="number" min={0} value={draft.cost} onChange={(e) => set("cost", Number(e.target.value))} className="h-10" />
      </div>
      <div className="space-y-1">
        <Label>{t("shipments.targetPrice")}</Label>
        <Input type="number" min={0} value={draft.targetPrice} onChange={(e) => set("targetPrice", Number(e.target.value))} className="h-10" />
      </div>
    </div>
  )
}

export function DeviceIntakeForm({
  draft,
  set,
  models,
  onAdd,
}: {
  draft: IntakeDraft
  set: Update
  models: DeviceModelView[]
  onAdd: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("shipments.scanImei")}</Label>
        <BarcodeInput
          value={draft.imei}
          onChange={(e) => set("imei", e.target.value)}
          onScan={onAdd}
          placeholder="358249091234567"
          className="h-10"
        />
      </div>
      <ModelStorageRow draft={draft} set={set} models={models} />
      <PricingRow draft={draft} set={set} />
      <Button type="button" variant="outline" className="w-full" onClick={onAdd}>
        + {t("shipments.addDevice")}
      </Button>
    </div>
  )
}
