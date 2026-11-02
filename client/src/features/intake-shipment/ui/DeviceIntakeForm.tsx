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
import type { IntakeDraftValues } from "../model/use-intake-batch"

type Form = UseFormReturn<IntakeDraftValues>

const EMPTY: IntakeDraftValues = { imei: "", modelId: "", specs: {}, cost: 0, targetPrice: 0 }

function ImeiField({ form, onScan }: { form: Form; onScan: () => void }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <Label>{t("shipments.scanImei")}</Label>
      <Controller
        control={form.control}
        name="imei"
        render={({ field }) => (
          <BarcodeInput
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            onScan={onScan}
            placeholder="358249091234567"
            className="h-10"
          />
        )}
      />
    </div>
  )
}

function ModelField({ form, models }: { form: Form; models: DeviceModelView[] }) {
  const { t } = useI18n()
  return (
    <div className="space-y-1">
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

function NumberField({ form, name, label }: { form: Form; name: "cost" | "targetPrice"; label: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Input type="number" min={0} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} className="h-10" />
        )}
      />
    </div>
  )
}

/** Scan + model + dynamic specs + pricing row. `onAdd` returns true when added. */
export function DeviceIntakeForm({
  models,
  onAdd,
}: {
  models: DeviceModelView[]
  onAdd: (values: IntakeDraftValues) => boolean
}) {
  const { t } = useI18n()
  const form = useForm<IntakeDraftValues>({ defaultValues: EMPTY })
  const modelId = useWatch({ control: form.control, name: "modelId" })
  const { attributes } = useDeviceModelAttributes(modelId)

  const add = () => {
    // Stay on the same model + specs for the next unit; reset only IMEI + cost.
    if (onAdd(form.getValues())) {
      form.setValue("imei", "")
      form.setValue("cost", 0)
    }
  }

  return (
    <div className="space-y-4">
      <ImeiField form={form} onScan={add} />
      <ModelField form={form} models={models} />
      {modelId && attributes.length > 0 && (
        <DynamicSpecFields attributes={attributes} control={form.control} name="specs" />
      )}
      <div className="grid grid-cols-2 gap-3">
        <NumberField form={form} name="cost" label={t("shipments.acquisitionCost")} />
        <NumberField form={form} name="targetPrice" label={t("shipments.targetPrice")} />
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={add}>
        + {t("shipments.addDevice")}
      </Button>
    </div>
  )
}
