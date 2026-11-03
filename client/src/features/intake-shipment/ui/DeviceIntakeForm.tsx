import { useForm, useWatch, Controller, type UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import {
  DynamicSpecFields,
  useDeviceModelAttributes,
  type DeviceModelView,
} from "@/entities/device-model"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Button } from "@/shared/ui/button"
import { Combobox } from "@/shared/ui/combobox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import { useScanIntake, type SlotErrors } from "../model/use-scan-intake"
import type { IntakeDraftValues } from "../model/use-intake-batch"
import { IntakeConfirmDialog } from "./IntakeConfirmDialog"

type Form = UseFormReturn<IntakeDraftValues>
type Scan = ReturnType<typeof useScanIntake>

const EMPTY: IntakeDraftValues = { imei: "", imei2: "", dualSim: false, modelId: "", specs: {}, cost: 0, targetPrice: 0 }

function SlotError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-medium text-destructive">{message}</p>
}

/** IMEI 1 + Dual SIM switch (inline), and IMEI 2 only when dual-SIM is on. */
function ImeiBlock({ form, scan, errors }: { form: Form; scan: Scan; errors: SlotErrors }) {
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
              <Label className="text-[#646464]">{t("inventory.dualSim")}</Label>
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

function ModelField({ form, models, innerRef }: { form: Form; models: DeviceModelView[]; innerRef: Scan["modelRef"] }) {
  const { t } = useI18n()
  return (
    <div className="space-y-1" ref={innerRef}>
      <Label>{t("inventory.model")}</Label>
      <Controller
        control={form.control}
        name="modelId"
        render={({ field }) => (
          <Combobox
            value={field.value}
            onChange={(v) => {
              field.onChange(v)
              form.setValue("specs", {})
            }}
            options={models.map((m) => ({ value: m.id, label: `${m.brand} ${m.name}` }))}
            placeholder={t("shipments.selectModel")}
            searchPlaceholder={t("shipments.selectModel")}
            emptyText={t("inventory.empty")}
          />
        )}
      />
    </div>
  )
}

function NumberField({
  form,
  name,
  label,
  innerRef,
}: {
  form: Form
  name: "cost" | "targetPrice"
  label: string
  innerRef?: Scan["costRef"]
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Input
            ref={innerRef}
            type="number"
            min={0}
            value={field.value}
            onChange={(e) => field.onChange(Number(e.target.value))}
            className="h-10"
          />
        )}
      />
    </div>
  )
}

/** Model + specs + cost (batch defaults), then scan IMEI slots → confirm → add. */
export function DeviceIntakeForm({
  models,
  onAdd,
}: {
  models: DeviceModelView[]
  onAdd: (values: IntakeDraftValues) => string | null
}) {
  const { t } = useI18n()
  const form = useForm<IntakeDraftValues>({ defaultValues: EMPTY })
  const modelId = useWatch({ control: form.control, name: "modelId" })
  const { attributes } = useDeviceModelAttributes(modelId)
  const scan = useScanIntake(form, onAdd)
  const modelLabel = models.find((m) => m.id === modelId)
  return (
    <div className="space-y-4">
      <ModelField form={form} models={models} innerRef={scan.modelRef} />
      {modelId && attributes.length > 0 && (
        <DynamicSpecFields attributes={attributes} control={form.control} name="specs" />
      )}
      <div className="grid grid-cols-2 gap-3">
        <NumberField form={form} name="cost" label={t("shipments.acquisitionCost")} innerRef={scan.costRef} />
        <NumberField form={form} name="targetPrice" label={t("shipments.targetPrice")} />
      </div>
      <ImeiBlock form={form} scan={scan} errors={scan.slotErrors} />
      <Button type="button" variant="outline" className="w-full" onClick={scan.stage}>
        + {t("shipments.addDevice")}
      </Button>
      <IntakeConfirmDialog
        open={scan.confirmOpen}
        modelLabel={modelLabel ? `${modelLabel.brand} ${modelLabel.name}` : t("inventory.model")}
        imei={form.getValues("imei")}
        imei2={form.getValues("dualSim") ? form.getValues("imei2") || null : null}
        cost={form.getValues("cost")}
        error={scan.confirmError}
        onConfirm={scan.confirm}
        onCancel={scan.cancelConfirm}
      />
    </div>
  )
}
