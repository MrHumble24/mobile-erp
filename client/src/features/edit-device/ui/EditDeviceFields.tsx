import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { STORAGE_OPTIONS } from "@/entities/device"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import type { EditDeviceValues } from "../model/edit-device.schema"

type Form = UseFormReturn<EditDeviceValues>

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

function TextField({
  form,
  name,
  label,
  type = "text",
}: {
  form: Form
  name: "color" | "ram" | "condition" | "targetPrice"
  label: string
  type?: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function EditDeviceFields({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StorageField form={form} />
        <TextField form={form} name="color" label={t("inventory.color")} />
        <TextField form={form} name="ram" label={t("inventory.ram")} />
        <TextField form={form} name="condition" label={t("inventory.condition")} />
      </div>
      <TextField form={form} name="targetPrice" label={t("inventory.targetPrice")} type="number" />
    </div>
  )
}
