import { Loader2, X } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { DeviceStatusBadge } from "@/entities/device"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { useConsignDeviceLookup } from "../model/use-consign-lookup"
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
  const lookup = useConsignDeviceLookup(row, onChange)
  const code = row.imei.trim()

  return (
    <div className="space-y-2 rounded-[14px] border border-border bg-muted p-3">
      <RowHeader index={index} canRemove={canRemove} onRemove={onRemove} />
      <BarcodeInput
        value={row.imei}
        onChange={(e) => onChange({ imei: e.target.value })}
        onScan={(scanned) => onChange({ imei: scanned.trim() })}
        onClear={() => onChange({ imei: "" })}
        placeholder={t("catalog.scanCode")}
      />
      {code.length >= 3 && (
        <ConsignDeviceLookup
          code={lookup.resolvedCode || code}
          device={lookup.device}
          isFetching={lookup.isFetching}
        />
      )}
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

function RowHeader({ index, canRemove, onRemove }: { index: number; canRemove: boolean; onRemove: () => void }) {
  const { t } = useI18n()
  return (
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
  )
}

/** The card under the code input: which unit that code resolved to, or why not. */
function ConsignDeviceLookup({
  code,
  device,
  isFetching,
}: {
  code: string
  device: ReturnType<typeof useConsignDeviceLookup>["device"]
  isFetching: boolean
}) {
  const { t } = useI18n()

  if (device) {
    const storage = device.specs.storage
    const storageSuffix =
      typeof storage === "string" && storage.length > 0 ? ` · ${storage}` : ""
    return (
      <div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {device.model.brand} {device.model.name}
              {storageSuffix}
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {code}
            </p>
          </div>
          <DeviceStatusBadge status={device.statusCode} />
        </div>
        {device.statusCode !== "IN_STOCK" && (
          <p className="mt-1 text-xs text-destructive">
            {t("consignments.mustBeInStock")}
          </p>
        )}
      </div>
    )
  }

  if (isFetching) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        {t("consignments.deviceLookingUp")}
      </div>
    )
  }

  return (
    <p className="text-xs text-destructive">
      {t("consignments.deviceNotFound")}
    </p>
  )
}
