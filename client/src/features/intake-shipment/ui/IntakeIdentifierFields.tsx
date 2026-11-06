import { useWatch, Controller, type UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import type { useScanIntake, SlotErrors } from "../model/use-scan-intake"
import type { IntakeDraftValues } from "../model/use-intake-batch"

type Form = UseFormReturn<IntakeDraftValues>
type Scan = ReturnType<typeof useScanIntake>

function SlotError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-medium text-destructive">{message}</p>
}

/** Serial-number input for a SERIAL model (no IMEI, no dual-SIM). */
export function SerialBlock({ form, scan, errors }: { form: Form; scan: Scan; errors: SlotErrors }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <Label>{t("catalog.serialNumber")}</Label>
      <Controller
        control={form.control}
        name="serialNumber"
        render={({ field }) => (
          <BarcodeInput
            ref={scan.serialRef}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            onScan={(code) => scan.onScanSlot("serialNumber", code)}
            placeholder={t("catalog.serialNumberHint")}
            className="h-10"
            autoFocus
          />
        )}
      />
      <SlotError message={errors.serialNumber} />
    </div>
  )
}

/** IMEI 1 + Dual SIM switch (inline), and IMEI 2 only when dual-SIM is on. */
export function ImeiBlock({ form, scan, errors }: { form: Form; scan: Scan; errors: SlotErrors }) {
  const { t } = useI18n()
  const dualSim = useWatch({ control: form.control, name: "dualSim" })
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t("shipments.scanImei")}</Label>
        <Controller
          control={form.control}
          name="dualSim"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">{t("inventory.dualSim")}</Label>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked)
                  if (!checked) form.setValue("imei2", "")
                }}
              />
            </div>
          )}
        />
      </div>
      <Controller
        control={form.control}
        name="imei"
        render={({ field }) => (
          <BarcodeInput
            ref={scan.imei1Ref}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            onScan={(code) => scan.onScanSlot("imei", code)}
            placeholder="358249091234567"
            className="h-10"
            autoFocus
          />
        )}
      />
      <SlotError message={errors.imei} />
      {dualSim && (
        <div className="space-y-2 pt-1">
          <Label>{t("inventory.imei2")}</Label>
          <Controller
            control={form.control}
            name="imei2"
            render={({ field }) => (
              <BarcodeInput
                ref={scan.imei2Ref}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onScan={(code) => scan.onScanSlot("imei2", code)}
                placeholder={t("inventory.imei2Hint")}
                className="h-10"
              />
            )}
          />
          <SlotError message={errors.imei2} />
        </div>
      )}
    </div>
  )
}
