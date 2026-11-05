import { Controller, type UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { useDeviceModels } from "@/entities/device-model"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import type { RepairFormValues } from "../model/repair-ticket-schema"

type Form = UseFormReturn<RepairFormValues>

const NO_MODEL = "__none__"

function ModelSelect({ form }: { form: Form }) {
  const { t } = useI18n()
  const { data: models } = useDeviceModels()
  return (
    <Controller
      control={form.control}
      name="modelId"
      render={({ field }) => (
        <div className="space-y-1">
          <Label>{t("repairs.modelOptional")}</Label>
          <Select
            value={field.value || NO_MODEL}
            onValueChange={(v) => field.onChange(!v || v === NO_MODEL ? "" : v)}
          >
            <SelectTrigger className="h-10"><SelectValue placeholder={t("repairs.selectModel")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_MODEL}>{t("repairs.noModel")}</SelectItem>
              {(models ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.brand} {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  )
}

function TextField({
  form,
  name,
  label,
}: {
  form: Form
  name: "deviceName" | "imei" | "serialNumber"
  label: string
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <div className="space-y-1">
          <Label>{label}</Label>
          <Input {...field} className="h-10" />
        </div>
      )}
    />
  )
}

function MoneyField({
  form,
  name,
  label,
}: {
  form: Form
  name: "agreedPrice" | "warrantyDays"
  label: string
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <div className="space-y-1">
          <Label>{label}</Label>
          <Input
            type="number"
            min={0}
            value={field.value}
            onChange={(e) => field.onChange(Number(e.target.value))}
            className="h-10 text-base font-bold"
          />
        </div>
      )}
    />
  )
}

/** The ticket's device, problem, price, warranty and notes (create + edit). */
export function RepairFields({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <TextField form={form} name="deviceName" label={t("repairs.deviceName")} />
      <ModelSelect form={form} />
      <div className="grid grid-cols-2 gap-3">
        <TextField form={form} name="imei" label={t("repairs.imei")} />
        <TextField form={form} name="serialNumber" label={t("repairs.serial")} />
      </div>
      <Controller
        control={form.control}
        name="problem"
        render={({ field }) => (
          <div className="space-y-1">
            <Label>{t("repairs.problem")}</Label>
            <Textarea {...field} rows={2} />
          </div>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <MoneyField form={form} name="agreedPrice" label={t("repairs.agreedPrice")} />
        <MoneyField form={form} name="warrantyDays" label={t("repairs.warrantyDays")} />
      </div>
      <Controller
        control={form.control}
        name="notes"
        render={({ field }) => (
          <div className="space-y-1">
            <Label>{t("repairs.notes")}</Label>
            <Textarea {...field} rows={2} />
          </div>
        )}
      />
    </div>
  )
}
