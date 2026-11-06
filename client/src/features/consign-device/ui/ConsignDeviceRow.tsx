import { X } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import type { DeviceRow } from "../model/use-consign-form"

export function ConsignDeviceRow({
  row,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  row: DeviceRow
  index: number
  canRemove: boolean
  onChange: (patch: Partial<DeviceRow>) => void
  onRemove: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-2 rounded-[14px] border border-border bg-muted p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">
          {t("consignments.device")} #{index + 1}
        </Label>
        {canRemove && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            <X className="size-3.5" />
            {t("consignments.removeDevice")}
          </Button>
        )}
      </div>
      <BarcodeInput
        value={row.imei}
        onChange={(e) => onChange({ imei: e.target.value })}
        onScan={(code) => onChange({ imei: code.trim() })}
        onClear={() => onChange({ imei: "" })}
        placeholder={t("catalog.scanCode")}
      />
      <div className="space-y-1">
        <Label>{t("consignments.agreedPrice")}</Label>
        <Input
          type="number"
          min={0}
          value={row.agreedPrice}
          onChange={(e) => onChange({ agreedPrice: e.target.value })}
          className="h-10 font-mono font-bold"
          required
        />
      </div>
    </div>
  )
}
