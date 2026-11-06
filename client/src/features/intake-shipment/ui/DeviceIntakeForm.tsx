import { useForm, useWatch, Controller, type UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import {
  DynamicSpecFields,
  useDeviceModelAttributes,
  type DeviceModelView,
} from "@/entities/device-model"
import { Button } from "@/shared/ui/button"
import { Combobox } from "@/shared/ui/combobox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useScanIntake } from "../model/use-scan-intake"
import { useIntakeLookup } from "../model/use-intake-lookup"
import type { IntakeDraftValues } from "../model/use-intake-batch"
import { IntakeConfirmDialog } from "./IntakeConfirmDialog"
import { IntakeLookupPanel } from "./IntakeLookupPanel"
import { ImeiBlock, SerialBlock } from "./IntakeIdentifierFields"

type Form = UseFormReturn<IntakeDraftValues>
type Scan = ReturnType<typeof useScanIntake>

const EMPTY: IntakeDraftValues = {
  imei: "", imei2: "", dualSim: false, serialNumber: "", kindCode: "IMEI",
  modelId: "", specs: {}, cost: 0, targetPrice: 0, unitExpense: 0, unitExpenseNote: "",
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
              // Kind drives which identifier the unit carries; reset both and specs.
              form.setValue("kindCode", models.find((m) => m.id === v)?.kindCode ?? "IMEI")
              form.setValue("specs", {})
              form.setValue("imei", "")
              form.setValue("imei2", "")
              form.setValue("serialNumber", "")
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

/** Phone expense (amount + optional note); shown only with `device.expense`. */
function ExpenseFields({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <div className="space-y-3 rounded-[12px] border border-border bg-muted p-3">
      <Controller
        control={form.control}
        name="unitExpense"
        render={({ field }) => (
          <div className="space-y-1">
            <Label>{t("inventory.unitExpense")}</Label>
            <Input
              type="number"
              min={0}
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className="h-10"
            />
          </div>
        )}
      />
      <Controller
        control={form.control}
        name="unitExpenseNote"
        render={({ field }) => (
          <div className="space-y-1">
            <Label>{t("inventory.unitExpenseNote")}</Label>
            <Input value={field.value} onChange={(e) => field.onChange(e.target.value)} className="h-10" />
          </div>
        )}
      />
      <p className="text-xs text-muted-foreground">{t("inventory.unitExpenseHint")}</p>
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

/** Model + specs + cost (batch defaults), then scan the unit's identifier → confirm → add. */
export function DeviceIntakeForm({
  models,
  onAdd,
  canExpense,
  canUpdate,
}: {
  models: DeviceModelView[]
  onAdd: (values: IntakeDraftValues) => string | null
  canExpense: boolean
  canUpdate: boolean
}) {
  const { t } = useI18n()
  const form = useForm<IntakeDraftValues>({ defaultValues: EMPTY })
  const modelId = useWatch({ control: form.control, name: "modelId" })
  const kindCode = useWatch({ control: form.control, name: "kindCode" })
  const { attributes } = useDeviceModelAttributes(modelId)
  const scan = useScanIntake(form, onAdd)
  // QUANTITY products are not stocked as units here (server rejects them, ADR 0029).
  const intakeModels = models.filter((m) => m.kindCode !== "QUANTITY")
  const lookup = useIntakeLookup(form, intakeModels, canUpdate)
  const modelLabel = models.find((m) => m.id === modelId)
  const isSerial = kindCode === "SERIAL"
  const confirmCode = isSerial ? form.getValues("serialNumber") : form.getValues("imei")
  return (
    <div className="space-y-4">
      <ModelField form={form} models={intakeModels} innerRef={scan.modelRef} />
      {modelId && attributes.length > 0 && (
        <DynamicSpecFields attributes={attributes} control={form.control} name="specs" />
      )}
      <div className="grid grid-cols-2 gap-3">
        <NumberField form={form} name="cost" label={t("shipments.acquisitionCost")} innerRef={scan.costRef} />
        <NumberField form={form} name="targetPrice" label={t("shipments.targetPrice")} />
      </div>
      {canExpense && <ExpenseFields form={form} />}
      {isSerial ? (
        <SerialBlock form={form} scan={scan} errors={scan.slotErrors} />
      ) : (
        <ImeiBlock form={form} scan={scan} errors={scan.slotErrors} />
      )}
      <IntakeLookupPanel lookup={lookup} models={intakeModels} />
      <Button type="button" variant="outline" className="w-full" onClick={scan.stage}>
        + {t("shipments.addDevice")}
      </Button>
      <IntakeConfirmDialog
        open={scan.confirmOpen}
        modelLabel={modelLabel ? `${modelLabel.brand} ${modelLabel.name}` : t("inventory.model")}
        imei={confirmCode}
        imei2={!isSerial && form.getValues("dualSim") ? form.getValues("imei2") || null : null}
        cost={form.getValues("cost")}
        error={scan.confirmError}
        onConfirm={scan.confirm}
        onCancel={scan.cancelConfirm}
      />
    </div>
  )
}
