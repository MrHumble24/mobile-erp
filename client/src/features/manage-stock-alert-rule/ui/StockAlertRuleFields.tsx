import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { STORAGE_OPTIONS } from "@/entities/device"
import { useDeviceModels } from "@/entities/device-model"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import type { StockAlertFormValues } from "../model/stock-alert-form.schema"

type Form = UseFormReturn<StockAlertFormValues>

function ModelField({ form, disabled }: { form: Form; disabled: boolean }) {
  const { t } = useI18n()
  const { data: models } = useDeviceModels()
  return (
    <FormField
      control={form.control}
      name="modelId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("inventory.model")}</FormLabel>
          <Select value={field.value || ""} onValueChange={field.onChange} disabled={disabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t("common.select")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {(models ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.brand} {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function StorageField({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="storage"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("inventory.storage")}</FormLabel>
          <Select value={field.value || ""} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t("common.select")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {STORAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function ThresholdField({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="threshold"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("inventory.threshold")}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function StockAlertRuleFields({ form, isEdit }: { form: Form; isEdit: boolean }) {
  return (
    <div className="space-y-4">
      <ModelField form={form} disabled={isEdit} />
      <StorageField form={form} />
      <ThresholdField form={form} />
    </div>
  )
}
