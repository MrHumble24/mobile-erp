import { Controller, useWatch, type UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Label } from "@/shared/ui/label"
import {
  slugKey,
  type DeviceModelFormValues,
} from "../model/device-model-form.schema"
import { OptionsChipsEditor } from "./OptionsChipsEditor"

type FormApi = UseFormReturn<DeviceModelFormValues>

/** Options for one default spec (`storage` / `color`), bound straight to its
 *  attribute row — the create-time shortcut that hides label/key/type plumbing. */
function SpecOptionsField({
  form,
  attrKey,
  label,
}: {
  form: FormApi
  attrKey: string
  label: string
}) {
  const attributes = useWatch({ control: form.control, name: "attributes" }) ?? []
  const index = attributes.findIndex(
    (a) => a.key === attrKey || slugKey(a.label) === attrKey
  )
  if (index === -1) return null

  const currentOptions = attributes[index]?.options ?? []

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Controller
        control={form.control}
        name={`attributes.${index}.options`}
        render={({ field }) => (
          <OptionsChipsEditor
            value={field.value ?? currentOptions}
            onChange={(next) => {
              field.onChange(next)
              const updated = [...form.getValues("attributes")]
              if (updated[index]) {
                updated[index] = { ...updated[index], options: next }
                form.setValue("attributes", updated, { shouldDirty: true })
              }
            }}
          />
        )}
      />
    </div>
  )
}

/**
 * Create-time spec entry: just the storage and color options a merchant thinks
 * in. The full schema editor (keys, types, required) stays in edit mode.
 */
export function SimpleSpecFields({ form }: { form: FormApi }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 gap-4 rounded-[12px] border border-border bg-muted p-3 sm:grid-cols-2">
      <SpecOptionsField form={form} attrKey="storage" label={t("inventory.storage")} />
      <SpecOptionsField form={form} attrKey="color" label={t("inventory.color")} />
    </div>
  )
}
