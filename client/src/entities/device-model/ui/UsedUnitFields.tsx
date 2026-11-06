import { useWatch, Controller, type UseFormReturn, type Path, type PathValue } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Combobox } from "@/shared/ui/combobox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import type { DeviceModelView, ProductKind } from "../model/device-model.types"
import { useDeviceModelAttributes } from "../model/use-device-models"
import { DynamicSpecFields } from "./DynamicSpecFields"
import type { UsedUnitValues } from "../lib/used-unit"

interface UsedUnitFieldsProps<T extends UsedUnitValues> {
  form: UseFormReturn<T>
  /** IMEI/SERIAL models to choose from; QUANTITY products are filtered out. */
  models: DeviceModelView[]
}

function name<T extends UsedUnitValues>(key: keyof UsedUnitValues): Path<T> {
  return key as unknown as Path<T>
}

function SerialIdentifier<T extends UsedUnitValues>({ form }: { form: UseFormReturn<T> }) {
  const { t } = useI18n()
  return (
    <div className="space-y-1">
      <Label>{t("catalog.serialNumber")}</Label>
      <Controller
        control={form.control}
        name={name<T>("serialNumber")}
        render={({ field }) => (
          <Input
            value={field.value as string}
            onChange={(e) => field.onChange(e.target.value)}
            placeholder={t("catalog.serialNumberHint")}
            className="h-10"
          />
        )}
      />
    </div>
  )
}

function DualSimToggle<T extends UsedUnitValues>({ form }: { form: UseFormReturn<T> }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-between">
      <Label>{t("shipments.scanImei")}</Label>
      <Controller
        control={form.control}
        name={name<T>("dualSim")}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">{t("inventory.dualSim")}</Label>
            <Switch
              checked={field.value as boolean}
              onCheckedChange={(checked) => {
                field.onChange(checked)
                if (!checked) form.setValue(name<T>("imei2"), "" as PathValue<T, Path<T>>)
              }}
            />
          </div>
        )}
      />
    </div>
  )
}

function ImeiIdentifier<T extends UsedUnitValues>({ form }: { form: UseFormReturn<T> }) {
  const { t } = useI18n()
  const dualSim = useWatch({ control: form.control, name: name<T>("dualSim") }) as boolean
  return (
    <div className="space-y-2">
      <DualSimToggle form={form} />
      <Controller
        control={form.control}
        name={name<T>("imei")}
        render={({ field }) => (
          <Input
            value={field.value as string}
            onChange={(e) => field.onChange(e.target.value)}
            placeholder="358249091234567"
            inputMode="numeric"
            className="h-10"
          />
        )}
      />
      {dualSim && (
        <Controller
          control={form.control}
          name={name<T>("imei2")}
          render={({ field }) => (
            <Input
              value={field.value as string}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={t("inventory.imei2Hint")}
              inputMode="numeric"
              className="h-10"
            />
          )}
        />
      )}
    </div>
  )
}

/** Identifier input for the chosen model's kind: serial, or IMEI (+ dual SIM). */
function IdentifierFields<T extends UsedUnitValues>({ form, kind }: { form: UseFormReturn<T>; kind: ProductKind }) {
  return kind === "SERIAL" ? <SerialIdentifier form={form} /> : <ImeiIdentifier form={form} />
}

/** Model picker + its spec fields + the kind's identifier, for a used unit. */
export function UsedUnitFields<T extends UsedUnitValues>({ form, models }: UsedUnitFieldsProps<T>) {
  const { t } = useI18n()
  const modelId = useWatch({ control: form.control, name: name<T>("modelId") }) as string
  const kindCode = useWatch({ control: form.control, name: name<T>("kindCode") }) as ProductKind
  const { attributes } = useDeviceModelAttributes(modelId)
  const options = models.filter((m) => m.kindCode !== "QUANTITY")

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>{t("inventory.model")}</Label>
        <Controller
          control={form.control}
          name={name<T>("modelId")}
          render={({ field }) => (
            <Combobox
              value={field.value as string}
              onChange={(v) => {
                field.onChange(v)
                const picked = options.find((m) => m.id === v)
                form.setValue(name<T>("kindCode"), (picked?.kindCode ?? "IMEI") as PathValue<T, Path<T>>)
                form.setValue(name<T>("specs"), {} as PathValue<T, Path<T>>)
                form.setValue(name<T>("imei"), "" as PathValue<T, Path<T>>)
                form.setValue(name<T>("imei2"), "" as PathValue<T, Path<T>>)
                form.setValue(name<T>("serialNumber"), "" as PathValue<T, Path<T>>)
              }}
              options={options.map((m) => ({ value: m.id, label: `${m.brand} ${m.name}` }))}
              placeholder={t("shipments.selectModel")}
              searchPlaceholder={t("shipments.selectModel")}
              emptyText={t("inventory.empty")}
            />
          )}
        />
      </div>
      {modelId && attributes.length > 0 && (
        <DynamicSpecFields attributes={attributes} control={form.control} name={name<T>("specs")} />
      )}
      {modelId && <IdentifierFields form={form} kind={kindCode} />}
    </div>
  )
}
